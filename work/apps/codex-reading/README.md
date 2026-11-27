# Codex会话

一个只作用于 Hana 原会话的 v2 App：通过 `agent/before-start` 追加可选的回复风格提示词，不创建卡片、不替换聊天界面。

## 选项

- `styleProfile`：Hana 原生（不注入），以及 Codex 设置里实际存在的七种风格——默认（预设风格和语调）、专业可靠（精雕细琢）、亲和友善（温和健谈）、直言不讳（直率乐观）、天马行空（趣味幻想）、高效务实（简练直白）、吐槽达人（犀利毒舌）。括号内是风格解释，不是独立选项。
- `friendliness`：默认 / 增强 / 减弱。
- `enthusiasm`：默认 / 增强 / 减弱。
- `emoji`：默认 / 增强 / 减弱。
- `visual`：默认 / 简洁。
- `headings`：默认 / 增强 / 减弱。
- `customInstructions`：原样追加的可选文本。

默认选择 `hana`，不注入任何内容，Hana 原有角色、记忆、提示词和沟通方式不变。只有选择 Codex 风格或调整维度后，才会在系统提示末尾追加一个带标记的独立块；切换到 `hana` 会移除该块，不会删除 Hana 原有提示词。

## 排版覆盖

`typographyEnabled` 打开后，应用把一份只作用于助手回复的排版层放进 Hana 的渲染目录，控制正文字体、字号、行高、段落间距、聊天列宽、超链接样式和代码字号。样式只命中 `[class*="_messageAssistant_"] .md-content`，不改侧边栏、设置页和用户自己的消息。

安装与恢复由 `patch/apply.mjs`、`patch/restore.mjs` 完成，用 Hana 自带的 Node 运行，不依赖 PowerShell；Windows / macOS / Linux 走同一套代码。宿主把渲染目录作为读写根传给子进程，因此不需要额外安装运行时。首次写入注入标签后要重启一次 Hana，之后改设置约 2 秒生效。

## 来源

- Codex 基础提示词、模型指令和最终回复规则：`openai/codex`，Apache-2.0，安装包内 `sources/codex/` 保留原文。
- 七种基础风格和滑杆的公开模型事实：`asgeirtj/system_prompts_leaks` 的 OpenAI 档案；安装包内 `sources/personalities/` 保留原文。该仓库是第三方整理，不是 OpenAI 官方仓库。只采用与 Codex 设置选项对应的七种，不额外添加 ChatGPT 专属人格。
- 风格名称、滑杆含义和选项范围参考 OpenAI Help Center《Customizing Your ChatGPT Personality》以及用户提供的 Codex 设置截图。

## 验证

```powershell
node work/build-style-catalog.mjs
node --test work/tests/style-engine.test.js
node scripts/validate-app.mjs --dir <app-directory> --json
```

UI 冒烟不适用于本应用：本应用没有卡片或页面。真实行为验证应在 Hana 原会话中切换风格后观察下一轮回复。
