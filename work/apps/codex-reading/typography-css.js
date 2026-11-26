export const TYPOGRAPHY_STYLE_ID = "hana-codex-typography";

const ROOT_VARIABLES = [
  "--chat-message-font-size",
  "--chat-column-width",
  "--reading-font-family",
  "--font-serif",
  "--font-serif-text",
];

const ASSISTANT = '[class*="_messageAssistant_"]';

function num(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function buildTypographyCss(payload) {
  const lineHeight = num(payload?.lineHeight, 1.75);
  const paragraphGap = num(payload?.paragraphGap, 0.9);
  const codeFontSize = num(payload?.codeFontSize, 13);
  const rules = [
    `${ASSISTANT} .md-content{line-height:${lineHeight};}`,
    `${ASSISTANT} .md-content>p{margin:0 0 ${paragraphGap}em;}`,
    `${ASSISTANT} .md-content>p:last-child{margin-bottom:0;}`,
    `${ASSISTANT} .md-content h1{font-size:1.5em;line-height:1.35;margin:1.1em 0 .5em;}`,
    `${ASSISTANT} .md-content h2{font-size:1.28em;line-height:1.4;margin:1em 0 .45em;}`,
    `${ASSISTANT} .md-content h3{font-size:1.12em;line-height:1.45;margin:.9em 0 .4em;}`,
    `${ASSISTANT} .md-content h4{font-size:1em;line-height:1.5;margin:.8em 0 .35em;}`,
    `${ASSISTANT} .md-content ul,${ASSISTANT} .md-content ol{margin:.45em 0 .75em;padding-left:1.45em;}`,
    `${ASSISTANT} .md-content li{margin:.22em 0;}`,
    `${ASSISTANT} .md-content li>p{margin:0 0 .35em;}`,
    `${ASSISTANT} .md-content blockquote{margin:.8em 0;padding-left:.9em;border-left:2px solid var(--border);color:var(--text-light);}`,
    `${ASSISTANT} .md-content pre{font-size:${codeFontSize}px;line-height:1.55;}`,
    `${ASSISTANT} .md-content :not(pre)>code{font-size:${codeFontSize}px;}`,
    `${ASSISTANT} .md-content hr{margin:1.4em 0;border:none;border-top:1px solid var(--border);}`,
  ];

  if (payload?.linkStyle === "underline") {
    rules.push(
      `${ASSISTANT} .md-content a{color:var(--link);text-decoration:underline;text-underline-offset:2px;text-decoration-thickness:1px;}`,
      `${ASSISTANT} .md-content a:hover{color:var(--link-hover);}`,
    );
  } else if (payload?.linkStyle === "plain") {
    rules.push(
      `${ASSISTANT} .md-content a{color:var(--link);text-decoration:none;border-bottom:1px solid color-mix(in srgb, var(--link) 45%, transparent);}`,
      `${ASSISTANT} .md-content a:hover{color:var(--link-hover);border-bottom-color:var(--link-hover);}`,
    );
  }

  return rules.join("\n");
}

export function applyTypography(doc, payload) {
  if (!doc?.documentElement) return;
  const root = doc.documentElement;
  const existing = doc.getElementById(TYPOGRAPHY_STYLE_ID);

  if (!payload || payload.enabled !== true) {
    for (const name of ROOT_VARIABLES) root.style.removeProperty(name);
    if (existing) existing.remove();
    return;
  }

  root.style.setProperty("--chat-message-font-size", `${num(payload.fontSize, 16)}px`);
  root.style.setProperty("--chat-column-width", `${num(payload.columnWidth, 720)}px`);
  if (typeof payload.fontFamily === "string" && payload.fontFamily.trim()) {
    const family = payload.fontFamily.trim();
    root.style.setProperty("--reading-font-family", family);
    root.style.setProperty("--font-serif", family);
    root.style.setProperty("--font-serif-text", family);
  } else {
    root.style.removeProperty("--reading-font-family");
    root.style.removeProperty("--font-serif");
    root.style.removeProperty("--font-serif-text");
  }

  const style = existing ?? doc.createElement("style");
  style.id = TYPOGRAPHY_STYLE_ID;
  style.textContent = buildTypographyCss(payload);
  if (!existing) (doc.head ?? root).appendChild(style);
}
