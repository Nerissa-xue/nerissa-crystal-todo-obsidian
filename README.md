# Crystal Todo · 水晶待办（Obsidian 插件）

把待办变成晶莹剔透的水晶方块。不想干，就锤两下；做完了，让它漂亮地消失。完成的宝石会掉进「今日战利品」柜子里。

Turn your todos into crystal-clear blocks. Don't feel like it? Bonk it a couple of times. Done? Let it disappear beautifully. Completed gems drop into your "Today's Trophies" case.

## 功能

- **水晶方块板**：多个模块（zone），可新增 / 删除 / 点标题改名；方块高度随文字自适应
- **🔨 解解气**：锤方块发泄——Q 弹抖动 + BOME + 星星，脸逐渐失控（😖→😠→🤬→💢），锤满 10 下整屏震动 + 爆炸特效，但方块不会消失（该干还得干）
- **🪄 做完啦**：消消乐式完成——弹跳碎裂 + 星光四溅，5 秒内可撤销
- **拖拽换模块**：按住方块拖动到别的模块
- **◆ 今日战利品柜**：
  - 完成的方块结晶成小宝石落进收藏架（颜色与原方块一致）
  - 大数字（今日完成数）+ 🔥 最高连击徽章（2.5 秒内连续完成）
  - 带时间的流水记录（最新在上）
  - 点宝石可把待办捡回原模块
  - 按本地日历日自动清零
- **音效**：WebAudio 实时合成（锤子 / 完成 / 爆炸），默认关闭，右上角可开
- **自动保存**：数据存在 vault 的 `.obsidian/plugins/crystal-todo/data.json`，随 vault 同步

## 安装

本插件尚未提交到 Obsidian 社区插件市场，请手动安装：

1. 克隆或下载本仓库
2. 把 `main.js`、`manifest.json`、`styles.css` 三个文件复制到你的 vault：
   ```
   <你的vault>/.obsidian/plugins/crystal-todo/
   ```
   （直接复制本仓库根目录即可，`node_modules` 不需要）
3. 打开 Obsidian → 设置 → 第三方插件（Community plugins）
   - 如处于「安全模式 / Restricted mode」，先关闭
   - 在已安装插件列表里启用 **Crystal Todo**
4. 点击左侧边栏的 💎 宝石图标，或命令面板搜索「打开水晶待办板」

## 使用

| 操作 | 方式 |
|---|---|
| 打开看板 | 左侧 💎 图标 / 命令面板「打开水晶待办板」 |
| 切换工具 | 点工具按钮，或在看板内按 `1`（锤子）/ `2`（魔法棒） |
| 新增待办 | 顶部输入框 + 「落入模块」下拉框 + 「落一个」 |
| 完成 / 解气 | 选中工具后点方块 |
| 换模块 | 按住方块拖动 |
| 改名 / 删模块 | 点模块标题 / 点 × |
| 捡回待办 | 点战利品柜里的宝石 |

## 开发

```bash
npm install
npm run dev      # 监听模式
npm run build    # 生产构建 → main.js
```

- `main.ts`：插件主体（视图 + 数据持久化）
- `styles.css`：全部样式
- `manifest.json`：插件元信息

## 数据格式

`data.json`：

```json
{
  "finished": 3,
  "nextId": 10,
  "zones": [{ "name": "今天必须干完", "icon": "💪", "blockFace": "💪", "blocks": [{ "id": 1, "text": "...", "anger": 0, "face": "" }] }],
  "completed": [{ "id": 1, "text": "...", "zoneUid": "z0", "tint": "pink", "day": "2026-10-27", "doneAt": 1793066007200 }],
  "dayMax": { "date": "2026-10-27", "max": 3 }
}
```

## License

MIT
