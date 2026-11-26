# Codex 会话（Hana 扩展）

把 Codex 的回复风格和排版机制移植到 Hana 的原会话：七个基础风格、语气滑杆，以及字体、行高、列宽、链接和代码样式的排版补丁。默认选择 Hana 原生，不注入任何提示词。

## 功能

- 回复风格：Hana 原生、Codex 默认、专业可靠、亲和友善、直言不讳、天马行空、高效务实、吐槽达人。
- 语气滑杆：亲切程度、热情程度、表情符号、可视化回答、标题和列表。
- 排版补丁：正文字体与字号、行高、段落间距、聊天列宽、超链接样式、代码字号。
- 设置页内置「应用 Codex 外观」和「恢复 Hana 原样」，补丁可随时撤销。

## 目录

```text
work/
  apps/codex-reading/      Hana v2 App（manifest、入口、样式层、设置页、补丁脚本）
  build-style-catalog.mjs  从 sources 生成风格目录
  tests/                   风格与排版的单元测试
```

## 安装

1. 把 `work/apps/codex-reading` 复制到 `%USERPROFILE%\.hanako\apps\codex-reading`。
2. 在 Hana 中重载扩展，打开「设置 → Codex会话」。
3. 首次点「应用 Codex 外观」后重启一次 Hana，让注入脚本加载；之后调整设置约 2 秒生效。

## 开发

```powershell
cd work
node build-style-catalog.mjs
node --test tests\style-engine.test.js tests\typography.test.js
```

## 来源与边界

- Codex 基础提示词取自 `openai/codex`，Apache-2.0，原文保留在 `apps/codex-reading/sources/codex/`。
- 七种基础风格的文本来自第三方公开整理 `asgeirtj/system_prompts_leaks`，不是 OpenAI 官方仓库；仅作本地私人备份，不要把这份仓库公开分发。
- 语气滑杆的「减弱 / 简洁」方向没有逐字官方原文，按设置界面的公开语义写成明确指令。
- 排版补丁会修改 Hana 渲染目录里的 `pad.html` / `mobile.html` 和排版文件；Hana 更新后需要重新点一次「应用 Codex 外观」。
