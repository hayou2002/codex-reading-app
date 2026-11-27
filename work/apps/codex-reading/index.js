import { defineApp } from "./sdk/app-contract/server-client.js";
import { buildCodexStyleDecision } from "./style-engine.js";
import { buildTypographyPayload } from "./typography-settings.js";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const name = "codex-reading";

const APP_DIR = path.dirname(fileURLToPath(import.meta.url));
const HOME_DIR = path.resolve(APP_DIR, "..", "..");
const DATA_DIR = path.join(HOME_DIR, "app-data", "codex-reading");
const PAYLOAD_PATH = path.join(DATA_DIR, "codex-payload.json");
const STATE_PATH = path.join(DATA_DIR, "patch-state.json");
const APPLY_SCRIPT = path.join(APP_DIR, "patch", "apply.mjs");
const RESTORE_SCRIPT = path.join(APP_DIR, "patch", "restore.mjs");
const KNOWN_KEYS = new Set([
  "styleProfile",
  "friendliness",
  "enthusiasm",
  "emoji",
  "visual",
  "headings",
  "typographyEnabled",
  "contentFontPreset",
  "contentFontCustom",
  "contentFontSize",
  "lineHeight",
  "paragraphGap",
  "columnWidth",
  "linkStyle",
  "codeFontSize",
  "customInstructions",
]);

let cachedNodePath;

async function resolveNodePath(sdk) {
  if (cachedNodePath) return cachedNodePath;
  const fromEnv = (process.env.HANA_NODE_RUNTIME ?? "").trim();
  if (fromEnv) {
    cachedNodePath = fromEnv;
    return cachedNodePath;
  }
  try {
    const info = await sdk.process.resolveExecutable({ candidates: ["node", "node.exe"] });
    if (info?.path) {
      cachedNodePath = info.path;
      return cachedNodePath;
    }
  } catch {}
  return null;
}

function sandboxArgs() {
  const sandboxed = process.execArgv.some((arg) => arg === "--permission" || arg.startsWith("--experimental-permission"));
  if (!sandboxed) return [];
  const rendererRoot = path.join(HOME_DIR, "artifacts", "renderer");
  return [`--allow-fs-read=${rendererRoot}`, `--allow-fs-write=${rendererRoot}`];
}

function spawnOnce(exe, script, args) {
  return new Promise((resolve) => {
    const child = spawn(exe, [...sandboxArgs(), script, ...args], {
      windowsHide: true,
      env: { ...process.env, NODE_OPTIONS: "" },
    });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    const timer = setTimeout(() => {
      try { child.kill(); } catch {}
      finish({ ok: false, code: -1, output: "timed out after 30s" });
    }, 30000);
    child.stdout?.on("data", (chunk) => { stdout += String(chunk); });
    child.stderr?.on("data", (chunk) => { stderr += String(chunk); });
    child.on("error", (error) => {
      clearTimeout(timer);
      finish({ ok: false, code: -1, output: String(error?.message ?? error) });
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      finish({ ok: code === 0, code, output: `${stdout}${stderr}`.trim() });
    });
  });
}

async function runNode(script, args, sdk) {
  const candidates = [await resolveNodePath(sdk), process.execPath].filter(Boolean);
  const tried = [];
  for (const exe of candidates) {
    const result = await spawnOnce(exe, script, args);
    if (result.ok) return result;
    tried.push(`${path.basename(exe)}: ${result.output.split("\n")[0].slice(0, 160)}`);
    if (!/ERR_ACCESS_DENIED|ENOENT|EACCES|EINVAL/.test(result.output)) return result;
  }
  return {
    ok: false,
    code: -1,
    output: `找不到可用的 Node 运行时。已尝试：\n${tried.map((line) => `- ${line}`).join("\n")}\n请安装 Node.js，或把 HANA_NODE_RUNTIME 指向 node 可执行文件。`,
  };
}

export default defineApp(async (sdk) => {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {}

  const readPatchState = async () => {
    try {
      const value = await sdk.storage.global.get("patchState");
      return value && typeof value === "object" ? value : { installed: false };
    } catch {
      return { installed: false };
    }
  };

  const writePatchState = async (state) => {
    try {
      await sdk.storage.global.set("patchState", state);
    } catch {}
  };

  const readValues = async () => {
    try {
      return await sdk.config.getAll();
    } catch {
      return {};
    }
  };

  const applyPatch = async () => {
    const payload = buildTypographyPayload(await readValues());
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(PAYLOAD_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    } catch (error) {
      return { ok: false, code: -1, output: `payload write failed: ${error instanceof Error ? error.message : String(error)}` };
    }
    return runNode(APPLY_SCRIPT, [
      "--home", HOME_DIR,
      "--app", APP_DIR,
      "--payload", PAYLOAD_PATH,
      "--state", STATE_PATH,
    ], sdk);
  };

  const restorePatch = () =>
    runNode(RESTORE_SCRIPT, ["--home", HOME_DIR, "--state", STATE_PATH], sdk);

  sdk.routes.register((app) => {
    app.get("/state", async (c) => {
      const values = await readValues();
      let schema = null;
      try { schema = sdk.config.getSchema(); } catch {}
      return c.json({ values, schema, patch: await readPatchState() });
    });

    app.post("/save", async (c) => {
      let body;
      try { body = await c.req.json(); } catch { return c.json({ ok: false, error: "invalid JSON body" }, 400); }
      const values = body?.values;
      if (!values || typeof values !== "object") return c.json({ ok: false, error: "values is required" }, 400);
      const patch = {};
      for (const [key, value] of Object.entries(values)) {
        if (KNOWN_KEYS.has(key)) patch[key] = value;
      }
      try {
        const pending = sdk.config.setMany(patch);
        if (pending && typeof pending.then === "function") await pending;
      } catch (error) {
        return c.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, 400);
      }
      const saved = await readValues();
      if ((await readPatchState()).installed) {
        const result = await applyPatch();
        return c.json({ ok: true, values: saved, applied: result.ok, output: result.output });
      }
      return c.json({ ok: true, values: saved });
    });

    app.post("/apply", async (c) => {
      const result = await applyPatch();
      if (result.ok) {
        const match = /installed\s+(\d+)/i.exec(result.output ?? "");
        await writePatchState({
          installed: true,
          renderers: match ? Number(match[1]) : null,
          at: new Date().toISOString(),
        });
      }
      return c.json({ ...result, patch: await readPatchState() }, result.ok ? 200 : 500);
    });

    app.post("/restore", async (c) => {
      const result = await restorePatch();
      if (result.ok) {
        await writePatchState({ installed: false, at: new Date().toISOString() });
      }
      return c.json({ ...result, patch: await readPatchState() }, result.ok ? 200 : 500);
    });

  });

  try {
    await sdk.hooks.onDecision("agent/before-start", async (invocation) => {
      const settings = await sdk.config.getAll();
      return buildCodexStyleDecision(settings, invocation);
    });
    await sdk.logger.info("Codex style hook registered");
  } catch (error) {
    if (!String(error?.message).includes('provides no "sessionHooks" service')) throw error;
    await sdk.logger.warn("Style hook is unavailable in this isolated validation host.");
  }
});
