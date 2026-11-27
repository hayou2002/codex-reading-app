# Codex 会话

![Codex 会话 · Hana 扩展](assets/readme/hero.svg)

一个 Hana v2 扩展：把 Codex 的回复风格与排版搬进 Hana 自己的会话，不换界面、不建卡片。默认停在「Hana 原生」，不往系统提示里加一个字。

`0.5.0` · 私有备份 · Windows / macOS / Linux 同一套代码

## 它做什么

**回复风格**：七个 Codex 风格（默认、专业可靠、亲和友善、直言不讳、天马行空、高效务实、吐槽达人），外加不注入的 Hana 原生。风格通过 `agent/before-start` 追加到系统提示末尾的独立块里，切回原生只删这一块。

**语气滑杆**：亲切程度、热情程度、表情符号、可视化回答、标题和列表，默认 / 增强 / 减弱。

**排版覆盖**：字体、字号、行高、段落间距、聊天列宽、超链接样式、代码字号。样式只命中助手回复（`[class*="_messageAssistant_"] .md-content`），不动侧边栏、设置页和你自己的消息。

## 安装

1. 把 `work/apps/codex-reading` 复制到 `~/.hanako/apps/codex-reading`（Windows 为 `%USERPROFILE%\.hanako\apps\codex-reading`）。
2. 重载扩展，打开「设置 → Codex会话」。
3. 点「应用 Codex 外观」，然后重启一次 Hana，让注入脚本加载。

重启之后，改设置约 2 秒生效，不用再重启。

## 设置项

| 分组 | 项目 |
| --- | --- |
| 风格 | 基础风格和语气、亲切程度、热情程度、表情符号、可视化回答、标题和列表 |
| 排版 | 启用开关、内容字体（跟随 Hana / 系统无衬线 / 霞鹜新致宋 / 自定义）、字号、行高、段落间距、列宽、链接样式、代码字号 |
| 其他 | 自定义指令（原样追加，不覆盖角色与安全规则） |

## 排版补丁怎么工作

`patch/apply.mjs` 往 `~/.hanako/artifacts/renderer/<版本>/` 写三个文件，并在 `pad.html`、`mobile.html` 的 `</body>` 前插入一行 `<script>`。页面里的 `typography.js` 每 2 秒读一次 `codex-typography.json`，把值落到 CSS 变量和回复区样式上。

`patch/restore.mjs` 先把 payload 改成关闭，等一轮轮询生效，再摘掉脚本、删掉文件。两个脚本都用 Hana 自带的 Node 运行，不依赖 PowerShell；宿主把渲染目录作为读写根传给子进程。

## 已知边界

- Hana 更新会换一个新的渲染目录，需要重新点一次「应用 Codex 外观」。
- 「自定义字体」要求本机已安装该字体，应用只写字体名，不打包字体文件。
- 语气滑杆里「减弱 / 简洁」的方向没有逐字官方原文，是按设置界面语义写的指令。

## 目录

```text
assets/readme/hero.svg        README 首图
work/apps/codex-reading/      Hana v2 App（manifest、入口、样式层、设置页、补丁脚本）
work/build-style-catalog.mjs  从 sources 生成风格目录
work/tests/                   风格与排版的单元测试
```

## 开发

```bash
cd work
node build-style-catalog.mjs
node --test tests/style-engine.test.js tests/typography.test.js
```

改完应用后用官方校验器检查包结构（`HANA_APP_TOOLS_ROOT` 指向 Hana 安装目录）：

```bash
node "$HANA_APP_TOOLS_ROOT/scripts/validate-app.mjs" --dir apps/codex-reading --json
```

## 来源与边界

- Codex 基础提示词取自 `openai/codex`（Apache-2.0），原文保留在 `work/apps/codex-reading/sources/codex/`。
- 七种基础风格的文本来自第三方公开整理 `asgeirtj/system_prompts_leaks`，不是 OpenAI 官方仓库。
- 仓库因此保持私有，不作公开分发；需要公开时先剥离这部分文本。
