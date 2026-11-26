import { STYLE_PROFILES, STYLE_TRAITS } from "./style-catalog.generated.js";

export const STYLE_BLOCK_BEGIN = "<!-- codex-reply-style:begin -->";
export const STYLE_BLOCK_END = "<!-- codex-reply-style:end -->";

const DEFAULTS = Object.freeze({
  styleProfile: "hana",
  friendliness: "default",
  enthusiasm: "default",
  emoji: "default",
  visual: "default",
  headings: "default",
  customInstructions: "",
});

const VALUES = Object.freeze({
  friendliness: new Set(["default", "increase", "decrease"]),
  enthusiasm: new Set(["default", "increase", "decrease"]),
  emoji: new Set(["default", "increase", "decrease"]),
  visual: new Set(["default", "concise"]),
  headings: new Set(["default", "increase", "decrease"]),
});

export function normalizeStyleSettings(input = {}) {
  const styleProfile = Object.hasOwn(STYLE_PROFILES, input.styleProfile)
    ? input.styleProfile
    : DEFAULTS.styleProfile;
  const result = { ...DEFAULTS, styleProfile };
  for (const [key, allowed] of Object.entries(VALUES)) {
    result[key] = allowed.has(input[key]) ? input[key] : DEFAULTS[key];
  }
  result.customInstructions = typeof input.customInstructions === "string"
    ? input.customInstructions.trim()
    : "";
  return result;
}

function traitLines(settings) {
  const lines = [];
  for (const key of ["friendliness", "enthusiasm", "emoji", "headings"]) {
    const value = settings[key];
    if (value !== "default" && STYLE_TRAITS[key]?.[value]) {
      lines.push(STYLE_TRAITS[key][value]);
    }
  }
  if (settings.visual === "concise" && STYLE_TRAITS.visual.concise) {
    lines.push(STYLE_TRAITS.visual.concise);
  }
  return lines;
}

export function buildCodexStyleBlock(input) {
  const settings = normalizeStyleSettings(input);
  const profile = STYLE_PROFILES[settings.styleProfile];
  const traits = traitLines(settings);
  const parts = [];
  if (profile.prompt) parts.push(profile.prompt);
  if (traits.length) parts.push(`## Trait Instructions\n\n${traits.join("\n\n")}`);
  if (settings.customInstructions) {
    parts.push(`## Custom Instructions\n\n${settings.customInstructions}`);
  }
  if (!parts.length) return "";
  return `${STYLE_BLOCK_BEGIN}\n# Codex reply style\n\n${parts.join("\n\n")}\n\nThis style layer changes only how replies are expressed. Follow the user's explicit instructions and the existing character, safety, and task instructions first.\n${STYLE_BLOCK_END}`;
}

function withoutExistingStyleBlock(systemPrompt) {
  const start = systemPrompt.indexOf(STYLE_BLOCK_BEGIN);
  if (start < 0) return systemPrompt;
  const end = systemPrompt.indexOf(STYLE_BLOCK_END, start);
  if (end < 0) return systemPrompt;
  const before = systemPrompt.slice(0, start).replace(/\s+$/, "");
  const after = systemPrompt.slice(end + STYLE_BLOCK_END.length).replace(/^\s+/, "");
  return [before, after].filter(Boolean).join("\n\n");
}

export function buildCodexStyleDecision(settings, invocation) {
  const original = typeof invocation?.systemPrompt === "string" ? invocation.systemPrompt : "";
  const cleaned = withoutExistingStyleBlock(original);
  const block = buildCodexStyleBlock(settings);
  if (!block) return cleaned === original ? undefined : { systemPrompt: cleaned };
  return { systemPrompt: `${cleaned.trimEnd()}\n\n${block}` };
}
