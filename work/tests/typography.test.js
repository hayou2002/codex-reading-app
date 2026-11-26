import assert from "node:assert/strict";
import test from "node:test";
import { buildTypographyPayload, normalizeTypography } from "../apps/codex-reading/typography-settings.js";
import { buildTypographyCss } from "../apps/codex-reading/typography-css.js";

test("typography is opt-in and keeps Hana fonts by default", () => {
  const settings = normalizeTypography({});
  assert.equal(settings.typographyEnabled, false);
  assert.equal(settings.contentFontPreset, "inherit");
  assert.equal(buildTypographyPayload({}).fontFamily, "");
});

test("numeric settings are clamped to usable ranges", () => {
  const settings = normalizeTypography({
    contentFontSize: 99,
    lineHeight: 0,
    paragraphGap: -3,
    columnWidth: 100,
    codeFontSize: 99,
  });
  assert.equal(settings.contentFontSize, 24);
  assert.equal(settings.lineHeight, 1.2);
  assert.equal(settings.paragraphGap, 0);
  assert.equal(settings.columnWidth, 480);
  assert.equal(settings.codeFontSize, 20);
});

test("sans preset resolves to a system stack and custom quotes a font name", () => {
  assert.match(buildTypographyPayload({ contentFontPreset: "sans" }).fontFamily, /system-ui/);
  assert.equal(
    buildTypographyPayload({ contentFontPreset: "custom", contentFontCustom: "My Font" }).fontFamily,
    '"My Font", sans-serif',
  );
});

test("css uses stable md-content hooks and link modes", () => {
  const payload = buildTypographyPayload({
    typographyEnabled: true,
    lineHeight: 1.6,
    paragraphGap: 0.5,
    linkStyle: "underline",
    codeFontSize: 12,
  });
  const css = buildTypographyCss(payload);
  assert.match(css, /_messageAssistant_.*line-height:1\.6/);
  assert.match(css, /margin:0 0 0\.5em/);
  assert.match(css, /text-decoration:underline/);
  assert.match(css, /pre\{font-size:12px/);
});
