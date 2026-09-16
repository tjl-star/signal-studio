# Signal Studio

Signal Studio 是本地单机运营数据平台，正式应用位于 [`dashboard-app`](dashboard-app/)。

## 当前架构

```text
data_provider / Quick BI MCP / 已审核快照
        -> Python 导入与校验
        -> SQLite
        -> FastAPI
        -> Vue 3 + TypeScript + ECharts
```

## 使用方式

进入 `dashboard-app` 后：

- 双击 `启动看板.bat` 启动并打开 <http://127.0.0.1:8765/>。
- 双击 `同步MCP数据.bat` 增量同步已核验的 Quick BI 数据。
- 双击 `更新全部数据.bat` 重新导入登记快照，并继续执行 MCP 增量同步。
- 使用 `备份本地数据.bat`、`恢复本地数据.bat` 管理本地数据。
- 仅在可信网络内使用 `启动局域网共享.bat`。

详细安装、测试和运维说明见 [`dashboard-app/README.md`](dashboard-app/README.md)。

## 根目录文件

- `AGENTS.md`：项目级工程约束。
- `agent.md`：当前产品、数据与开发协作规范。
- `DATA_SOURCE_INDEX.md`：强制数据源路由与口径索引。
- `GENRE_DISPLAY_RULES.md`：剧种展示规则。

旧静态看板、演示版本、历史基线和一次性中间产物已经移除；正式应用不再依赖历史页面代码。

## 安全说明

本仓库不得提交 MCP Token、用户标识、本地 SQLite、日志或备份。Quick BI 认证只从运行时环境变量或当前用户的 Codex MCP 配置读取。仓库中的 `source-data/` 是应用首次初始化所需的已审核快照；新增或替换快照前必须确认其适合进入公开仓库。
