import fs from "node:fs";
import path from "node:path";

const MARKER = "data-hana-codex-typography";
const PAGES = ["pad.html", "mobile.html"];
const OWNED_FILES = ["codex-typography.json", "typography.js", "typography-css.js"];

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

const args = readArgs(process.argv.slice(2));
const home = args.home;
const statePath = args.state;

if (!home || !statePath) {
  process.stderr.write("usage: node restore.mjs --home <hana-home> --state <json>\n");
  process.exit(1);
}

const rendererRoot = path.join(home, "artifacts", "renderer");
let dirs = [];
if (fs.existsSync(rendererRoot)) {
  dirs = fs
    .readdirSync(rendererRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(rendererRoot, entry.name))
    .filter((dir) => fs.existsSync(path.join(dir, "mobile.html")));
}

// Let an open page poll the disabled payload before its script is removed.
for (const dir of dirs) {
  const payload = path.join(dir, "codex-typography.json");
  if (!fs.existsSync(payload)) continue;
  fs.writeFileSync(payload, '{"v":1,"enabled":false}', "utf8");
}

if (dirs.length > 0) await new Promise((resolve) => setTimeout(resolve, 1600));

for (const dir of dirs) {
  for (const page of PAGES) {
    const file = path.join(dir, page);
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, "utf8");
    if (!html.includes(MARKER)) continue;
    const stripped = html.replace(/\s*<script[^>]*data-hana-codex-typography[^>]*><\/script>/g, "");
    fs.writeFileSync(file, stripped, "utf8");
  }
  for (const name of OWNED_FILES) {
    const file = path.join(dir, name);
    if (fs.existsSync(file)) fs.rmSync(file, { force: true });
  }
}

fs.writeFileSync(
  statePath,
  `${JSON.stringify({ installed: false, at: new Date().toISOString(), renderers: dirs.length }, null, 2)}\n`,
  "utf8",
);

console.log(`restored ${dirs.length}`);
