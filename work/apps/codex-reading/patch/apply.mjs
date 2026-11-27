import fs from "node:fs";
import path from "node:path";

const MARKER = "data-hana-codex-typography";
const TAG = `<script type="module" src="./typography.js?v=1" ${MARKER}></script>`;
const PAGES = ["pad.html", "mobile.html"];

function readArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith("--")) continue;
    args[key.slice(2)] = argv[index + 1];
    index += 1;
  }
  return args;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

const args = readArgs(process.argv.slice(2));
const home = args.home;
const appDir = args.app;
const payloadPath = args.payload;
const statePath = args.state;

if (!home || !appDir || !payloadPath || !statePath) {
  fail("usage: node apply.mjs --home <hana-home> --app <app-dir> --payload <json> --state <json>");
}

const rendererRoot = path.join(home, "artifacts", "renderer");
if (!fs.existsSync(rendererRoot)) fail(`renderer root not found: ${rendererRoot}`);

const dirs = fs
  .readdirSync(rendererRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(rendererRoot, entry.name))
  .filter((dir) => fs.existsSync(path.join(dir, "mobile.html")));

if (dirs.length === 0) fail(`no renderer directory with mobile.html under ${rendererRoot}`);

let patchedPages = 0;
for (const dir of dirs) {
  fs.copyFileSync(path.join(appDir, "typography.js"), path.join(dir, "typography.js"));
  fs.copyFileSync(path.join(appDir, "typography-css.js"), path.join(dir, "typography-css.js"));
  fs.copyFileSync(payloadPath, path.join(dir, "codex-typography.json"));

  for (const page of PAGES) {
    const file = path.join(dir, page);
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, "utf8");
    if (html.includes(MARKER)) continue;
    const index = html.lastIndexOf("</body>");
    if (index < 0) continue;
    fs.writeFileSync(file, `${html.slice(0, index)}    ${TAG}\n${html.slice(index)}`, "utf8");
    patchedPages += 1;
  }
}

fs.writeFileSync(
  statePath,
  `${JSON.stringify({ installed: true, at: new Date().toISOString(), renderers: dirs.length }, null, 2)}\n`,
  "utf8",
);

console.log(`installed ${dirs.length}`);
