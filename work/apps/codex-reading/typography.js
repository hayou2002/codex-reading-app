import { applyTypography } from "./typography-css.js";

const POLL_MS = 2000;
let lastText = "";

async function refresh() {
  try {
    const response = await fetch(`./codex-typography.json?_=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return;
    const text = await response.text();
    if (text === lastText) return;
    lastText = text;
    applyTypography(document, JSON.parse(text));
  } catch {
    // Keep the last applied typography while the settings file is unavailable.
  }
}

refresh();
setInterval(refresh, POLL_MS);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) refresh();
});
