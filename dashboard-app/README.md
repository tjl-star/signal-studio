# Signal Studio 本地运营数据平台

当前正式版本采用 SQLite + FastAPI + Vue 3。发布模式由 FastAPI 同源托管前端、API 与导出文件，默认仅监听 `127.0.0.1`。

## 已迁移页面

- 运营总览与客户端明细
- 运营月报（打印 / 导出 PDF）
- 搜索转化
- 内容榜单、热搜榜单
- BL 内容消费、剧种内容贡献、播放增长榜
- 首页频道、猜你喜欢
- 首页板块、Banner、弹窗与资源位 CSV 导出

## 首次准备

```powershell
cd dashboard-app
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements-dev.txt
cd frontend
npm.cmd install
npm.cmd run build
```

## 启动与更新

- `启动看板.bat`：首次运行自动初始化全部已迁移数据，之后启动服务并打开浏览器。
- `同步MCP数据.bat`：从 Quick BI MCP 增量同步搜索转化和首页“猜你喜欢”；默认同步昨天，也可追加 `--start-date YYYY-MM-DD --end-date YYYY-MM-DD`。
- `更新全部数据.bat`：重新导入所有已登记的真实快照，并继续执行一次 MCP 增量同步。
- 各个“更新*.bat”：只更新单一页面的数据。
- `启动局域网共享.bat`：绑定 `0.0.0.0`，仅限可信局域网临时共享。

当前初始化快照集中存放在 `source-data/`。该目录只保存当前导入器实际使用的真实快照，不包含旧页面代码或重复的历史中间文件。

MCP 凭证不会进入仓库、SQLite 或日志。同步程序优先读取 `QUICKBI_MCP_URL`、`QUICKBI_MCP_TOKEN`、`QUICKBI_MCP_USER_ID`，未设置时读取当前用户 Codex 配置中的 `mcp_servers.quickbi-data`。目前只自动接入已核验为同字段、同粒度的 `search_drama_conversion_data` 与 `recommend_data`；其他 MCP 接口在口径或现有模型不一致时保持待接入。

默认运行目录为 `%LOCALAPPDATA%\SignalStudio`，升级代码不会覆盖数据库。可通过 `SIGNAL_STUDIO_RUNTIME_DIR` 指定其他持久化目录。

## 备份与恢复

- `备份本地数据.bat` 使用 SQLite 在线备份 API，保存到 `%USERPROFILE%\Documents\SignalStudio备份`。
- `恢复本地数据.bat` 会校验 ZIP 结构及 SQLite 完整性；恢复前必须关闭服务，并输入 `RESTORE` 确认覆盖。
- 备份包含 SQLite、运行目录内的 `config.json` 和 `manual-mappings.json`（存在时）。

## 验证

```powershell
$env:PYTHONPATH = "backend"
.\.venv\Scripts\python.exe -m pytest backend\tests -q
cd frontend
npm.cmd run build
npx playwright test
```

浏览器访问 <http://127.0.0.1:8765/>。完整的新旧功能核对见 [FEATURE_PARITY.md](FEATURE_PARITY.md)。
