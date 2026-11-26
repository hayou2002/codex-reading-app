import assert from "node:assert/strict";
import test from "node:test";
import {
  STYLE_BLOCK_BEGIN,
  buildCodexStyleBlock,
  buildCodexStyleDecision,
  normalizeStyleSettings,
} from "../apps/codex-reading/style-engine.js";
import { STYLE_PROFILES } from "../apps/codex-reading/style-catalog.generated.js";

const invocation = (systemPrompt) => ({ systemPrompt });

test("Hana native and all default traits leave the prompt untouched", () => {
  assert.equal(buildCodexStyleDecision({ styleProfile: "hana" }, invocation("Original")), undefined);
});

test("all Codex base styles from the settings screenshot are present", () => {
  for (const id of ["codex-default", "professional", "friendly", "candid", "quirky", "efficient", "cynical"]) {
    assert.ok(STYLE_PROFILES[id]?.prompt, `missing profile ${id}`);
  }
});

test("the catalog contains exactly Hana plus the seven Codex styles", () => {
  assert.deepEqual(Object.keys(STYLE_PROFILES).sort(), [
    "candid", "codex-default", "cynical", "efficient",
    "friendly", "hana", "professional", "quirky",
  ]);
});

test("a selected profile appends to the existing prompt", () => {
  const result = buildCodexStyleDecision({ styleProfile: "professional" }, invocation("You are Hana."));
  assert.ok(result.systemPrompt.startsWith("You are Hana.\n\n"));
  assert.match(result.systemPrompt, /focused, formal, and exacting AI consultant/);
  assert.match(result.systemPrompt, /# Codex reply style/);
});

test("trait sliders use the published instruction text", () => {
  const result = buildCodexStyleBlock({
    styleProfile: "friendly",
    friendliness: "increase",
    enthusiasm: "increase",
    emoji: "increase",
    headings: "decrease",
    visual: "concise",
  });
  assert.match(result, /INCREASE the warmth/);
  assert.match(result, /Respond MORE enthusiastically/);
  assert.match(result, /slightly more emojis/);
  assert.match(result, /Use LESS markdown/);
  assert.match(result, /text-first responses/);
});

test("custom instructions work even with Hana native selected", () => {
  const result = buildCodexStyleBlock({
    styleProfile: "hana",
    customInstructions: "Use short paragraphs.",
  });
  assert.match(result, /## Custom Instructions\n\nUse short paragraphs\./);
  assert.doesNotMatch(result, /## Personality/);
});

test("switching profiles replaces only the app's previous block", () => {
  const first = buildCodexStyleDecision({ styleProfile: "friendly" }, invocation("Original"));
  const second = buildCodexStyleDecision({ styleProfile: "efficient" }, invocation(first.systemPrompt));
  assert.equal(second.systemPrompt.match(new RegExp(STYLE_BLOCK_BEGIN, "g")).length, 1);
  assert.doesNotMatch(second.systemPrompt, /warm, curious, witty/);
  assert.match(second.systemPrompt, /highly efficient assistant/);
});

test("returning to Hana native removes only a previous style block", () => {
  const enabled = buildCodexStyleDecision({ styleProfile: "friendly" }, invocation("Before\n\nAfter"));
  const disabled = buildCodexStyleDecision({ styleProfile: "hana" }, invocation(enabled.systemPrompt));
  assert.deepEqual(disabled, { systemPrompt: "Before\n\nAfter" });
});

test("invalid settings fall back to Hana native and defaults", () => {
  const normalized = normalizeStyleSettings({
    styleProfile: "not-a-profile",
    friendliness: "sideways",
    visual: "increase",
  });
  assert.equal(normalized.styleProfile, "hana");
  assert.equal(normalized.friendliness, "default");
  assert.equal(normalized.visual, "default");
});
