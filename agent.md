# Signal Studio Agent 规范

## 1. 当前状态

`dashboard-app/` 是本仓库唯一正式应用。旧静态看板、演示版和历史基线已经完成迁移并移除，不得重新引入或在旧页面上叠加补丁。

固定架构：

```text
data_provider / Quick BI MCP / 已审核快照
        -> Python 导入、校验与事务发布
        -> SQLite
        -> FastAPI
        -> Vue 3 + TypeScript + Vite + ECharts
```

默认交付是 Windows 本地一体化应用，由 FastAPI 同源托管前端和 API，仅监听 `127.0.0.1:8765`。除非用户单独要求，不引入服务器、Docker、Nginx、云数据库、Redis、Celery 或消息队列。

## 2. 当前页面

- 核心看板：运营总览、运营月报。
- 用户与内容：搜索转化、内容榜单、热搜榜单、BL 内容消费、剧种内容贡献、播放增长榜。
- 运营阵地：首页运营、资源位运营。
- 全站能力：分组导航、响应式布局、多主题、数据说明、加载/空数据/错误状态。

筛选条件必须同时作用于指标卡、图表、表格、导出、缓存键和 URL 状态。任何页面不得只改变标签而不改变查询结果。

## 3. 项目目录

- `dashboard-app/backend/app/api/`：FastAPI 路由，只处理协议和参数。
- `dashboard-app/backend/app/services/`：业务计算与页面组合。
- `dashboard-app/backend/app/repositories/`：SQL 与持久化。
- `dashboard-app/backend/app/sync/`：快照导入、数据校验与事务发布。
- `dashboard-app/backend/migrations/`：Alembic 迁移。
- `dashboard-app/frontend/src/`：Vue 应用、路由、组件、页面和设计 Token。
- `dashboard-app/source-data/`：当前导入器实际使用的已审核真实快照；不是运行数据库，也不是历史文件归档区。
- `%LOCALAPPDATA%\SignalStudio`：默认持久化运行目录，存放 SQLite、配置与人工映射。

不得把 SQLite、凭证、日志、备份、`node_modules`、`.venv`、构建产物或浏览器测试结果提交到仓库。

## 4. 强制数据协议

凡涉及查询、导出、核对、分析、接口接入、字段映射、数据库建模或快照更新，必须先完整读取根目录 `DATA_SOURCE_INDEX.md`。

1. 选择索引登记且当次真实可调用的唯一主数据源。
2. 核对日期、客户端、平台、新老设备、页面、频道、UV/PV 和去重粒度。
3. 不使用旧值、Mock 值或相近字段替代缺失指标。
4. 不跨接口拼接成不存在的 Quick BI 页面口径。
5. API 元信息必须包含来源、接口/组件、原始字段、查询日期、筛选条件、同步时间和数据状态。
6. 人工映射必须独立、可审计、可版本化，并记录原值、展示值、原因和更新时间。

当前已知边界：

- Banner 跳转播放没有可靠来源时保持空值。
- BL 内容播放 UV 的内容维度求和不等于全站去重用户 UV。
- 留存必须使用 Quick BI 留存组件，不得从活跃或转化数据推算。
- 运营总览继续以 `data_provider/coreData`、`perCapitaWatchDuration`、`perCapitaPlayCount` 为准。Quick BI MCP 的 `play_core_data` 与现有人均时长、人均次数口径及客户端聚合不一致，不得覆盖现有总览字段。

## 5. Quick BI MCP 当前接入基线

### 5.1 连接与凭证

2026-09-16 已通过直接 MCP 协议验证 `quickbi-data`：初始化、工具发现和业务查询均成功，共发现 38 个工具。当前 Codex 任务未暴露原生 quickbi-data 工具时，允许后端按 MCP 协议只读访问。

- 服务配置优先读取 `QUICKBI_MCP_URL`、`QUICKBI_MCP_TOKEN`、`QUICKBI_MCP_USER_ID`。
- 环境变量未设置时，后端读取当前用户 Codex 配置中的 `mcp_servers.quickbi-data`。
- 请求需要 `Authorization: Bearer <token>` 和 `userId`；值不得输出、入库或写入日志。
- MCP 响应可能是普通 JSON 或 SSE `data:` 消息；会话 ID 只在请求期间内存传递。
- 网络失败最多有限重试；认证失败和业务错误直接失败，保留上一份可用数据。
- 代码入口：`dashboard-app/backend/app/sync/quickbi_mcp.py`。

### 5.2 已直接接入

只有字段、日期、筛选和粒度与现有模型完全一致的接口进入自动同步：

| 页面/数据集 | MCP 工具 | 入库模型 | 固定筛选与规则 |
|---|---|---|---|
| 搜索转化 | `search_drama_conversion_data` | `SearchConversionDaily` | 全客户端；同一组件整行入库，不与 data_provider 拼接 |
| 首页运营－猜你喜欢 | `recommend_data` | `RecommendationMetric` | `source_type=猜你喜欢`；响应必须筛选 `page=首页`，剧集详情页记录不得混入 |

搜索转化原始字段固定为：`into_search_click_uv`、`search_suc_uv`、`search_suc_uv_ratio`、`result_content_click_uv`、`result_video_after_ad_play_start_uv`、`result_play_5mins_uv`、`ff_play_uv_rate`、`play_5min_uv_rate`、`result_play_time_uv`。

猜你喜欢原始字段固定为：`date`、`page`、`front_tab_uv`、`total_content_exposure_uv`、`total_content_click_uv`、`total_content_click_rate`、`ff_play_convert_rate`、`play_convert_rate`、`play_5min_rate_uv`、`avg_time_uv`。当前 MCP 响应不返回 `source_type` 字段，因此它只能来自已发送并校验的请求筛选条件。

同步必须先完成两个远端查询及全量校验，再开启一个 SQLite 写事务，同时发布两个数据集并分别记录 `SyncRun`。任一接口失败时不得写入部分结果。

### 5.3 当前不自动接入

| 能力 | 暂不接入原因 | 后续接入条件 |
|---|---|---|
| 运营总览 | `core_data` 可取设备指标，但 `play_core_data` 与现有人均指标口径不同；MCP `client_type` 是具体客户端编码，不等同于安卓/iOS/M站聚合 | 找到与现有三个 data_provider 接口同字段、同聚合的 MCP 组件并完成同日核对 |
| 内容榜单 | `season_play_top` 的指标与粒度不等于现有榜单模型 | 单独设计模型或确认完全一致的页面组件 |
| 首页频道 | MCP 当前工具不能完整覆盖现有绝对量与有效播放字段 | 找到同一页面组件的完整字段 |
| 板块、Banner、弹窗 | 没有已核验为现有模型同口径的 MCP 工具 | 按组件核对身份键、PV/UV、日期和客户端后独立接入 |
| 留存、会员、收入、订单 | MCP 有相关工具，但当前应用没有对应已验收页面和模型 | 作为独立功能完成业务定义、模型、迁移和页面验收 |

相近名称不是接入依据。未满足接入条件时保留现有真实快照或标记“待接入”。

### 5.4 已发现工具目录

工具清单以每次 `tools/list` 的实时结果为准；下列 38 项是 2026-09-16 的发现基线：

- 核心与播放：`core_data`、`play_core_data`、`play_device_ratio`、`pc_web_data`、`pc_non_auto_boot_core_data`、`pc_active_detail_data`。
- 搜索与推荐：`search_drama_conversion_data`、`home_drama_conversion_data`、`recommend_data`、`recommend_home_season_data`、`recommend_detail_season_data`、`no_play_search_rate`、`no_play_hot_search_word`、`drama_entrance_attribution`。
- 首页、频道与个性化：`home_channel_data`、`personalized_component_data`、`personalized_component_season_data`、`sub_channel_member_count`。
- 内容与剧集：`season_play_vv`、`season_play_vv2`、`season_play_top`、`season_info`。
- 会员、订单与收入：`order_channel_data`、`product_renewal_rate`、`subscription_cancellation_data`、`member_dau_stats`、`user_pay_channel_attribution`、`purchase_amount_flow`、`channel_purchase_amount_flow`、`integral_query`、`lejia_refund`、`hanxi_purchase_amount`、`product_repurchase_rate`、`ad_owner_roi`。
- 留存：`device_remain_data`。
- 维表：`app_type_list`、`app_channel_id`、`client_type_list`。

维表实测要点：`app_type_list` 包含安卓、iOS、M站、PC版和Mac版；`client_type_list` 返回具体发行客户端编码，其中 M站为 `web_applet`、M站横版为 `web_pc`。这些编码不能自行归并为现有页面客户端口径。

### 5.5 回归基线与同步入口

2026-09-15 的真实查询已与本地记录逐字段核对：搜索转化返回 1 行；`recommend_data` 在“猜你喜欢”筛选下返回首页和剧集详情页两行，只有首页行入库。该日期用于回归核对，不代表永久最新日期。

- `dashboard-app/同步MCP数据.bat`：默认同步昨天；支持 `--start-date YYYY-MM-DD --end-date YYYY-MM-DD`。
- `python -m app.cli sync-mcp`：同一同步入口的 CLI 形式。
- `dashboard-app/更新全部数据.bat`：先导入登记快照，再执行 MCP 增量同步。
- 页面状态使用 `local_mcp_sync`，前端显示“MCP 本地同步”。
- MCP 同步相关测试位于 `dashboard-app/backend/tests/test_quickbi_mcp_sync.py`，必须覆盖字段转换、页面筛选和失败不发布部分数据。

## 6. 数据与后端规则

- 使用 FastAPI、SQLAlchemy 2、Alembic 和 Pydantic。
- SQLite 启用 WAL、外键、`busy_timeout` 和事务写入。
- 同步流程固定为：抓取或读取快照 → 临时写入 → 质量校验 → 事务发布 → 记录同步批次。
- 同步失败时保留上一份可用数据。
- 明细事实只保存一份；周、月和榜单通过查询或轻量汇总生成。
- 列表接口必须服务端分页或设置明确行数上限。
- 原始比例、时长、日期和去重口径必须在导入时标准化并保留来源信息。
- 数据库结构变化必须新增 Alembic 迁移，不能依赖启动时临时改表。

## 7. 前端与 UI/UX 规则

- 使用 Vue 3、TypeScript、Vite、Vue Router、Pinia、Element Plus 和 ECharts。
- 所有页面通过统一 API repository/interface 调用 FastAPI，不读取 SQLite 或本地快照。
- 图表需要注册实际使用的 ECharts 模块，并验证画布内确实存在图形，不能只检查容器。
- 统一使用项目设计 Token；主题切换不得破坏语义色、对比度和图表可读性。
- 宽屏充分利用可用空间；窄屏导航、筛选器、指标卡和宽表必须可用且不产生整页横向溢出。
- 大表采用服务端分页或虚拟滚动。
- 数据截至日期、同步状态和来源说明必须可见。
- 页面必须覆盖加载、空数据、字段缺失、缓存数据、请求失败和重试状态。

## 8. 本地运行与维护

- `dashboard-app/启动看板.bat`：首次初始化、迁移、启动和打开浏览器。
- `dashboard-app/同步MCP数据.bat`：增量同步已核验的 Quick BI MCP 数据，默认同步昨天。
- `dashboard-app/更新全部数据.bat`：导入 `source-data/` 中全部登记快照，再执行 MCP 增量同步。
- `dashboard-app/备份本地数据.bat`：使用 SQLite 在线备份。
- `dashboard-app/恢复本地数据.bat`：校验归档和 SQLite 完整性后恢复，必须显式确认。
- `dashboard-app/启动局域网共享.bat`：仅限可信局域网临时使用。

升级代码不得覆盖 `%LOCALAPPDATA%\SignalStudio`。禁止将凭证写入前端、SQLite、仓库、日志或备份清单。

## 9. 变更流程

1. 先检查工作区和现有实现，保留用户未提交的相关改动。
2. 数据任务先读 `DATA_SOURCE_INDEX.md`，再验证来源、日期、字段和粒度。
3. 路由、service、repository 和页面职责保持分离。
4. 修改共享组件后，必须回归所有使用该组件的页面。
5. 页面变更需验证正常、空数据、错误和窄屏状态。
6. 不保留无引用的临时脚本、截图、旧实现、重复快照或构建缓存。
7. 删除数据或历史目录前，先确认当前应用、测试、启动脚本和恢复流程均无引用。

## 10. 完成标准

一次功能或重构任务只有在以下条件满足后才算完成：

- 修改范围内的数据口径、日期和筛选条件已核对。
- Alembic 迁移、后端测试、前端生产构建和浏览器自动化测试通过。
- 浏览器确认实际图表、指标、表格和交互均正常渲染。
- 首页与 `/api/health` 可访问，目标 API 返回真实数据和完整元信息。
- 备份与恢复相关变更经过安全验证。
- `git diff --check` 通过，没有凭证、运行数据库或生成产物进入仓库。
- 未完成或外部数据源不支持的能力被明确标记，不得伪装为已完成。
