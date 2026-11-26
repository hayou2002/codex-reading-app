import { hana } from "./assets/sdk.js";

const FIELD_META = {
  styleProfile: {
    type: "string",
    title: "基础风格和语气",
    description: "选择回复的整体语气；Hana 原生不会修改原有提示词。",
    enum: ["hana", "codex-default", "professional", "friendly", "candid", "quirky", "efficient", "cynical"],
    ui: {
      enumLabels: [
        "Hana 原生（不注入）",
        "Codex 默认 · 预设风格和语调",
        "专业可靠 · 精雕细琢",
        "亲和友善 · 温和健谈",
        "直言不讳 · 直率乐观",
        "天马行空 · 趣味幻想",
        "高效务实 · 简练直白",
        "吐槽达人 · 犀利毒舌",
      ],
    },
    default: "hana",
  },
  friendliness: {
    type: "string",
    title: "亲切程度",
    description: "选择回复语气的亲和友善程度。",
    enum: ["default", "increase", "decrease"],
    ui: { enumLabels: ["默认", "增强 · 更友好、更亲近", "减弱 · 更专业、事实性更强"] },
    default: "default",
  },
  enthusiasm: {
    type: "string",
    title: "热情程度",
    description: "选择回复语气的热情程度。",
    enum: ["default", "increase", "decrease"],
    ui: { enumLabels: ["默认", "增强 · 更加活力充沛", "减弱 · 更加冷静中立"] },
    default: "default",
  },
  emoji: {
    type: "string",
    title: "表情符号",
    description: "选择在回复中使用表情符号的频率。",
    enum: ["default", "increase", "decrease"],
    ui: { enumLabels: ["默认", "增强 · 使用更多表情符号", "减弱 · 尽量少用表情符号"] },
    default: "default",
  },
  visual: {
    type: "string",
    title: "可视化回答",
    description: "在标准回复和包含更多视觉或互动内容的回复之间选择。",
    enum: ["default", "concise"],
    ui: { enumLabels: ["默认", "简洁"] },
    default: "default",
  },
  headings: {
    type: "string",
    title: "标题和列表",
    description: "选择回复中标题和列表的使用频率。",
    enum: ["default", "increase", "decrease"],
    ui: { enumLabels: ["默认", "增强 · 采用清晰格式与列表结构", "减弱 · 更多段落文本，而非列表结构"] },
    default: "default",
  },
  typographyEnabled: {
    type: "boolean",
    title: "启用排版覆盖",
    description: "按下面的字体与排版显示回复。需要先安装外观补丁。",
    default: false,
  },
  contentFontPreset: {
    type: "string",
    title: "内容字体",
    description: "系统无衬线最接近 Codex；跟随 Hana 则保持当前阅读字体。",
    enum: ["inherit", "sans", "serif", "custom"],
    ui: {
      enumLabels: [
        "跟随 Hana（不改）",
        "系统无衬线 · 接近 Codex",
        "霞鹜新致宋 · Hana 阅读字体",
        "自定义字体",
      ],
    },
    default: "inherit",
  },
  contentFontCustom: {
    type: "string",
    title: "自定义字体名",
    description: "仅当内容字体选了“自定义字体”时使用，填本机已安装的字体名。",
    default: "",
  },
  contentFontSize: {
    type: "number",
    title: "正文字号",
    description: "回复正文的字号。Codex 默认约 16。",
    default: 16,
  },
  lineHeight: {
    type: "number",
    title: "行高",
    description: "回复正文的行高倍数。Codex 默认约 1.75。",
    default: 1.75,
  },
  paragraphGap: {
    type: "number",
    title: "段落间距",
    description: "段落之间的间距，0 表示紧贴。",
    default: 0.9,
  },
  columnWidth: {
    type: "number",
    title: "聊天列宽",
    description: "回复文字区域的最大宽度。Codex 约 720。",
    default: 720,
  },
  linkStyle: {
    type: "string",
    title: "超链接样式",
    description: "选择回复中超链接的显示方式。",
    enum: ["theme", "underline", "plain"],
    ui: { enumLabels: ["跟随主题", "下划线", "无下划线 · 细底边"] },
    default: "theme",
  },
  codeFontSize: {
    type: "number",
    title: "代码字号",
    description: "回复中代码块和行内代码的字号。",
    default: 13,
  },
  customInstructions: {
    type: "string",
    title: "自定义指令",
    description: "",
    default: "",
  },
};

const GROUPS = [
  {
    title: "回复风格",
    description: "决定回复的语气、结构和长度。选择 Hana 原生时不注入任何内容。",
    keys: ["styleProfile", "friendliness", "enthusiasm", "emoji", "visual", "headings"],
  },
  {
    title: "字体与排版",
    description: "作用到 Hana 的回复区。未安装外观补丁时，这些值只会保存，不会改变界面。",
    keys: [
      "typographyEnabled",
      "contentFontPreset",
      "contentFontCustom",
      "contentFontSize",
      "lineHeight",
      "paragraphGap",
      "columnWidth",
      "linkStyle",
      "codeFontSize",
    ],
  },
  {
    title: "自定义指令",
    description: "原样追加到风格层，不覆盖 Hana 的角色、安全规则和任务指令。",
    keys: ["customInstructions"],
  },
];

const state = {
  schema: null,
  values: {},
  patch: { installed: false },
  controls: new Map(),
};

const el = (id) => document.getElementById(id);
const statusPatch = el("patch-status");
const statusSave = el("save-status");

function setStatus(node, text, isError = false) {
  node.textContent = text ?? "";
  node.classList.toggle("error", Boolean(isError));
}

function parseColor(value) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const hex = text.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const raw = hex[1].length === 3 ? hex[1].split("").map((ch) => ch + ch).join("") : hex[1];
    return {
      r: Number.parseInt(raw.slice(0, 2), 16),
      g: Number.parseInt(raw.slice(2, 4), 16),
      b: Number.parseInt(raw.slice(4, 6), 16),
    };
  }
  const rgb = text.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  if (rgb) return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
  return null;
}

function detectAppearance(snapshot) {
  const styles = getComputedStyle(document.documentElement);
  for (const name of ["--bg", "--bg-card"]) {
    const color = parseColor(styles.getPropertyValue(name));
    if (!color) continue;
    const luminance = (0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b) / 255;
    return luminance > 0.55 ? "light" : "dark";
  }
  if (snapshot?.appearance === "light" || snapshot?.appearance === "dark") {
    return snapshot.appearance;
  }
  return "light";
}

function applyTheme(snapshot) {
  document.documentElement.dataset.appearance = detectAppearance(snapshot);
}

async function api(path, init) {
  const response = await hana.api.fetch(path, init);
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (!response.ok) {
    throw new Error(data?.error || data?.output || `HTTP ${response.status}`);
  }
  return data;
}

function labelOf(prop, value) {
  const labels = prop?.ui?.enumLabels;
  if (Array.isArray(labels) && Array.isArray(prop.enum)) {
    const index = prop.enum.indexOf(value);
    if (index >= 0 && labels[index]) return labels[index];
  }
  return String(value);
}

function buildControl(key, prop, current) {
  if (prop.type === "boolean") {
    const wrap = document.createElement("label");
    wrap.className = "switch";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = current === true;
    const track = document.createElement("span");
    wrap.append(input, track);
    state.controls.set(key, () => input.checked);
    return wrap;
  }

  if (Array.isArray(prop.enum)) {
    const select = document.createElement("select");
    for (const option of prop.enum) {
      const node = document.createElement("option");
      node.value = String(option);
      node.textContent = labelOf(prop, option);
      select.appendChild(node);
    }
    select.value = String(current ?? prop.default ?? prop.enum[0]);
    state.controls.set(key, () => {
      const raw = select.value;
      if (prop.type === "number" || prop.type === "integer") {
        return Number(raw);
      }
      return raw;
    });
    return select;
  }

  if (prop.type === "number" || prop.type === "integer") {
    const input = document.createElement("input");
    input.type = "number";
    input.step = key === "lineHeight" || key === "paragraphGap" ? "0.05" : "1";
    input.value = String(current ?? prop.default ?? 0);
    const unit = document.createElement("span");
    unit.className = "row-desc";
    unit.textContent = key === "paragraphGap" ? "em" : key === "lineHeight" ? "倍" : "px";
    const wrap = document.createElement("div");
    wrap.style.display = "flex";
    wrap.style.alignItems = "center";
    wrap.style.gap = "6px";
    wrap.append(input, unit);
    state.controls.set(key, () => Number(input.value));
    return wrap;
  }

  const input = document.createElement("input");
  input.type = "text";
  input.value = String(current ?? prop.default ?? "");
  input.placeholder = key === "contentFontCustom" ? "例如 HarmonyOS Sans SC" : "";
  state.controls.set(key, () => input.value);
  return input;
}

function renderGroup(group) {
  const section = document.createElement("section");
  section.className = "section";
  const head = document.createElement("div");
  head.className = "section-head";
  const title = document.createElement("h2");
  title.textContent = group.title;
  head.appendChild(title);
  section.appendChild(head);
  if (group.description) {
    const desc = document.createElement("p");
    desc.className = "section-desc";
    desc.textContent = group.description;
    section.appendChild(desc);
  }

  const panel = document.createElement("div");
  panel.className = "panel";
  const body = document.createElement("div");
  body.className = "panel-body group-body";
  for (const key of group.keys) {
    const prop = state.schema?.properties?.[key];
    if (!prop) continue;
    const row = document.createElement("div");
    row.className = "row";
    if (key === "customInstructions") row.classList.add("stacked");

    const main = document.createElement("div");
    main.className = "row-main";
    const name = document.createElement("div");
    name.className = "row-title";
    name.textContent = prop.title || key;
    main.appendChild(name);
    if (prop.description) {
      const desc = document.createElement("div");
      desc.className = "row-desc";
      desc.textContent = prop.description;
      main.appendChild(desc);
    }

    const control = document.createElement("div");
    control.className = "control";
    if (key === "customInstructions") {
      const textarea = document.createElement("textarea");
      textarea.value = String(state.values[key] ?? prop.default ?? "");
      textarea.placeholder = "例如：所有回复先给结论，再给最多三条依据。";
      state.controls.set(key, () => textarea.value);
      control.appendChild(textarea);
    } else {
      control.appendChild(buildControl(key, prop, state.values[key]));
    }

    row.append(main, control);
    body.appendChild(row);
  }
  panel.appendChild(body);
  section.appendChild(panel);
  return section;
}

function render() {
  const host = el("groups");
  host.replaceChildren();
  state.controls.clear();
  for (const group of GROUPS) host.appendChild(renderGroup(group));
  renderPatch();
}

function renderPatch() {
  const installed = state.patch?.installed === true;
  const badge = el("patch-badge");
  badge.textContent = installed ? "已安装" : "未安装";
  badge.classList.toggle("on", installed);
  el("restore-btn").disabled = !installed;
}

async function load() {
  setStatus(statusPatch, "正在读取…");
  try {
    await hana.ready?.();
    try {
      applyTheme(hana.theme?.getSnapshot?.());
      hana.theme?.subscribe?.(applyTheme);
    } catch {}
    const data = await api("/state");
    state.schema = { properties: FIELD_META };
    state.values = data.values ?? {};
    state.patch = data.patch ?? { installed: false };
    render();
    setStatus(statusPatch, "");
  } catch (error) {
    setStatus(statusPatch, `读取失败：${error.message}`, true);
  }
}

async function save() {
  const values = {};
  for (const [key, read] of state.controls) values[key] = read();
  el("save-btn").disabled = true;
  setStatus(statusSave, "保存中…");
  try {
    const result = await api("/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
    });
    state.values = result.values ?? values;
    setStatus(statusSave, result.applied === false ? "已保存，但补丁应用失败" : "已保存");
  } catch (error) {
    setStatus(statusSave, `保存失败：${error.message}`, true);
  } finally {
    el("save-btn").disabled = false;
  }
}

async function applyPatch() {
  const button = el("apply-btn");
  button.disabled = true;
  setStatus(statusPatch, "正在安装…");
  try {
    const result = await api("/apply", { method: "POST" });
    state.patch = result.patch ?? { installed: true };
    if (state.patch?.installed !== true) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      try {
        const fresh = await api("/state");
        state.patch = fresh.patch ?? state.patch;
      } catch {}
    }
    renderPatch();
    setStatus(statusPatch, `已安装到 ${result.patch?.renderers ?? "?"} 个渲染目录。请重启一次 Hana 让补丁生效。`);
  } catch (error) {
    setStatus(statusPatch, `安装失败：${error.message}`, true);
  } finally {
    button.disabled = false;
  }
}

async function restorePatch() {
  const button = el("restore-btn");
  button.disabled = true;
  setStatus(statusPatch, "正在恢复…");
  try {
    const result = await api("/restore", { method: "POST" });
    state.patch = result.patch ?? { installed: false };
    renderPatch();
    setStatus(statusPatch, "已恢复 Hana 原样，重开窗口后完全生效。");
  } catch (error) {
    setStatus(statusPatch, `恢复失败：${error.message}`, true);
  } finally {
    button.disabled = !state.patch?.installed;
  }
}

el("save-btn").addEventListener("click", save);
el("apply-btn").addEventListener("click", applyPatch);
el("restore-btn").addEventListener("click", restorePatch);

load();
