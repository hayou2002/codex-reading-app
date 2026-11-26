# 来源与边界

## 直接来源

- `codex/`：`openai/codex` 仓库的提示词文件，取用提交 `dd6d2c3d66fbd04963cb62a16d80213846242b90`。
- `codex/LICENSE`：该仓库的 Apache-2.0 许可证。
- `personalities/`：`asgeirtj/system_prompts_leaks` 仓库的 OpenAI 人格档案，取用提交 `c607f91ed3e6a6874c294976895728ec54bf553e`。这是第三方公开整理，不是 OpenAI 官方仓库。只有 `chatgpt-personality-instructions.md` 参与生成七个 Codex 风格选项；`nerdy.md`、`robot.md`、`listener.md`、`codex-friendly.md`、`codex-pragmatic.md` 仅作为研究留存，不作为可选风格。
- 名称与选项语义：OpenAI Help Center《Customizing Your ChatGPT Personality》及用户提供的 Codex 设置截图。

## 可追溯性

- 基础人格文本来自上述来源原文。
- 亲切度、热情度、表情符号和标题/列表的增强方向保留了公开模型提示词中的原句。
- 减弱方向、可视化“简洁”等未在公开提示词中找到逐字原文的选项，按设置界面公开语义写成明确指令；不要把这几句当作 OpenAI 私有原文。
- 应用不声称拥有 Hana 主聊天界面的字体、行距、列宽修改权限。那属于宿主渲染层，不是 v2 App 的公开接口。
