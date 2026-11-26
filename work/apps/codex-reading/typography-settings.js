export const FONT_PRESETS = Object.freeze({
  inherit: "",
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, "Microsoft YaHei", "PingFang SC", sans-serif',
  serif: 'HanaLXGWNeoZhiSong, "PT Serif", "Noto Serif SC", "Source Han Serif SC", "Songti SC", STSong, serif',
});

const FONT_PRESET_VALUES = Object.freeze([...Object.keys(FONT_PRESETS), "custom"]);
export const LINK_STYLES = Object.freeze(["theme", "underline", "plain"]);

const DEFAULTS = Object.freeze({
  typographyEnabled: false,
  contentFontPreset: "inherit",
  contentFontCustom: "",
  contentFontSize: 16,
  lineHeight: 1.75,
  paragraphGap: 0.9,
  columnWidth: 720,
  linkStyle: "theme",
  codeFontSize: 13,
});

function clampNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

export function normalizeTypography(input = {}) {
  const preset = FONT_PRESET_VALUES.includes(input.contentFontPreset)
    ? input.contentFontPreset
    : DEFAULTS.contentFontPreset;
  return {
    typographyEnabled: input.typographyEnabled === true,
    contentFontPreset: preset,
    contentFontCustom: typeof input.contentFontCustom === "string" ? input.contentFontCustom.trim() : "",
    contentFontSize: clampNumber(input.contentFontSize, DEFAULTS.contentFontSize, 12, 24),
    lineHeight: clampNumber(input.lineHeight, DEFAULTS.lineHeight, 1.2, 2.4),
    paragraphGap: clampNumber(input.paragraphGap, DEFAULTS.paragraphGap, 0, 2),
    columnWidth: Math.round(clampNumber(input.columnWidth, DEFAULTS.columnWidth, 480, 1200)),
    linkStyle: LINK_STYLES.includes(input.linkStyle) ? input.linkStyle : DEFAULTS.linkStyle,
    codeFontSize: Math.round(clampNumber(input.codeFontSize, DEFAULTS.codeFontSize, 10, 20)),
  };
}

function fontFamilyFor(settings) {
  if (settings.contentFontPreset === "custom") {
    const custom = settings.contentFontCustom.trim();
    return custom ? `"${custom.replace(/"/g, "")}", sans-serif` : "";
  }
  return FONT_PRESETS[settings.contentFontPreset] ?? "";
}

export function buildTypographyPayload(input) {
  const settings = normalizeTypography(input);
  return {
    v: 1,
    enabled: settings.typographyEnabled,
    fontFamily: fontFamilyFor(settings),
    fontSize: settings.contentFontSize,
    lineHeight: settings.lineHeight,
    paragraphGap: settings.paragraphGap,
    columnWidth: settings.columnWidth,
    linkStyle: settings.linkStyle,
    codeFontSize: settings.codeFontSize,
  };
}
