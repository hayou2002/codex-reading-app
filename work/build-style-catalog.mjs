import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "apps", "codex-reading");
const source = (file) => fs.readFileSync(path.join(root, "sources", file), "utf8").replace(/\r\n/g, "\n");

const normalize = (value) => value.trim().toLowerCase().replace(/\s+/g, " ");

function section(markdown, title, level = 2) {
  const lines = markdown.split("\n");
  const wanted = normalize(title);
  const start = lines.findIndex((line) => {
    const match = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    return match && match[1].length === level && normalize(match[2]) === wanted;
  });
  if (start < 0) throw new Error(`Missing section: ${title}`);
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    const match = lines[index].match(/^(#{1,6})\s+(.+?)\s*$/);
    if (!match) continue;
    if (match[1].length <= level || normalize(match[2]).startsWith("additional instruction")) {
      end = index;
      break;
    }
  }
  return lines.slice(start, end).join("\n").trim();
}

const chatgpt = source("personalities/chatgpt-personality-instructions.md");
const profiles = {
  hana: {
    label: "Hana 原生（不注入）",
    description: "保持 Hana 当前人格、提示词和回复方式。",
    prompt: "",
    source: "hana"
  },
  "codex-default": {
    label: "Codex 默认",
    description: "预设风格和语调。",
    prompt: section(source("codex/base.md"), "Personality"),
    source: "openai/codex@dd6d2c3:codex-rs/models-manager/prompt.md"
  },
  professional: {
    label: "专业可靠",
    description: "精雕细琢。",
    prompt: section(chatgpt, "Professional"),
    source: "asgeirtj/system_prompts_leaks:OpenAI/chatgpt-personality-instructions.md"
  },
  friendly: {
    label: "亲和友善",
    description: "温和健谈。",
    prompt: section(chatgpt, "Friendly"),
    source: "asgeirtj/system_prompts_leaks:OpenAI/chatgpt-personality-instructions.md"
  },
  candid: {
    label: "直言不讳",
    description: "直率乐观。",
    prompt: section(chatgpt, "Candid"),
    source: "asgeirtj/system_prompts_leaks:OpenAI/chatgpt-personality-instructions.md"
  },
  quirky: {
    label: "天马行空",
    description: "趣味幻想。",
    prompt: section(chatgpt, "Quirky"),
    source: "asgeirtj/system_prompts_leaks:OpenAI/chatgpt-personality-instructions.md"
  },
  efficient: {
    label: "高效务实",
    description: "简练直白。",
    prompt: section(chatgpt, "Efficient"),
    source: "asgeirtj/system_prompts_leaks:OpenAI/chatgpt-personality-instructions.md"
  },
  cynical: {
    label: "吐槽达人",
    description: "犀利毒舌。",
    prompt: section(chatgpt, "Cynical"),
    source: "asgeirtj/system_prompts_leaks:OpenAI/chatgpt-personality-instructions.md"
  }
};

const traits = {
  friendliness: {
    increase: "INCREASE the warmth of your responses. Use expressions that signal greater sincerity and kindness: the rhetorical tone of a friend the user would trust and enjoy spending time with.",
    decrease: "DECREASE the warmth of your responses. Prefer a more professional, factual, and emotionally restrained tone."
  },
  enthusiasm: {
    increase: "Respond MORE enthusiastically. Show greater excitement, curiosity, and active interest in whatever subject the user introduces, whether lighthearted or serious.",
    decrease: "Respond LESS enthusiastically. Stay calm, neutral, and measured."
  },
  emoji: {
    increase: "Color your responses with the creative use of slightly more emojis.",
    decrease: "Use fewer emojis. Prefer plain text unless an emoji adds clear meaning."
  },
  headings: {
    increase: "Use more headings and lists when they make structure clearer.",
    decrease: "Use LESS markdown in your responses. Instead of structured formatting, use more traditional sentences grouped thematically by paragraphs."
  },
  visual: {
    concise: "Use standard text-first responses. Avoid extra visual or interactive elements unless they materially improve the answer."
  }
};

const output = `export const STYLE_PROFILES = ${JSON.stringify(profiles, null, 2)};\n\nexport const STYLE_TRAITS = ${JSON.stringify(traits, null, 2)};\n`;
fs.writeFileSync(path.join(root, "style-catalog.generated.js"), output, "utf8");
console.log(`Wrote ${Object.keys(profiles).length} style profiles`);
