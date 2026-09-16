# 数据源索引：data_provider skill 与 quickbi-data MCP

> 用途：后续查询前先按本索引选择数据源；不跨接口拼接不同口径的指标。所有结果必须标注日期、客户端/平台、用户类型、来源和原始字段。
>
> 当前状态：`data_provider skill` 与 `quickbi-data MCP` 均已可调用；Quick BI 专属页面数据应优先通过对应 MCP 组件查询，并核对返回的页面、日期和原始字段。

## 1. 取数路由

| 需求 | 首选数据源 | 说明 |
|---|---|---|
| 核心设备数据 | data_provider / `coreData` | 新增设备、日活设备、播放率；需要密码 |
| 播放行为汇总 | data_provider | 人均观看、播放次数、类型播放占比、有效播放 |
| 剧集/电影播放榜 | data_provider / `seasonPlayVV`、`playTop10` | `seasonPlayVV` 有播放UV；`playTop10` 返回剧集/电影及新老用户榜 |
| 热搜剧集明细 | data_provider / `seasonSearchAuthInfo` | 搜索UV、搜索VV、内容类型、题材、剧种等 |
| 搜索整体转化 | quickbi-data MCP / Quick BI「搜索整体数据」 | 进入搜索页UV、搜索完成UV、影视点击UV、详情页起播UV、首帧/5分钟转化等必须取同一页面组件；data_provider 不能替代 |
| 首页/猜你喜欢 UV 漏斗 | data_provider / `dramaConversion` | 返回频道点击、内容点击、详情尝试播放、5/10分钟、有效播放等 UV 字段；不是 Quick BI 猜你喜欢页面的完整口径 |
| 首页/猜你喜欢 PV、曝光及页面专属口径 | quickbi-data MCP | 需调用 Quick BI 页面对应 OLAP 查询；不能用 `dramaConversion` 替代 |
| Banner、弹窗 | data_provider 或 quickbi-data MCP | data_provider 已有弹窗与Banner基础字段；页面专属字段以 Quick BI 为准 |
| 新用户/账号留存 | quickbi-data MCP | 当前 data_provider skill 没有留存接口；必须从 Quick BI 留存页面取数，并明确账号/设备口径 |

## 2. data_provider skill 接口目录

服务默认地址：`http://101.132.68.174:8123`。脚本：`C:\Users\tjldq\.codex\skills\data-provider\scripts\data_provider.py`。

| 子命令 | 服务接口 | 主要返回数据 | 常用日期参数 |
|---|---|---|---|
| `all-hotwords` | `allDeviceHotWords` | 全端热词、次数 | `date=yyyy-MM-dd` |
| `new-hotwords` | `newDeviceHotWords` | 新用户热词、次数 | `date=yyyy-MM-dd` |
| `near2hour` | `allDeviceHotWordsNear2Hour` | 近2小时热搜词 | 无日期 |
| `clienttype-info` | `getAllClientTypeInfo` | 客户端编码与名称 | 无 |
| `app-id` | `getAppId` | 频道标签/应用ID | 无 |
| `section` | `sectionData` | 板块曝光/点击 PV、UV、CTR | `startDate`, `endDate` |
| `banner-click` | `bannerClickData` | Banner曝光/点击 PV、UV、CTR | `startDate`, `endDate` |
| `drama-conversion` | `dramaConversion` | 首页频道/看剧转化 UV漏斗 | `startDate`, `endDate` |
| `custom-navigation` | `customNavigation` | 页面级导航曝光/点击 | `startDate`, `endDate` |
| `custom-navigation-detail` | `customNavigationDetail` | 页面版块曝光/点击明细 | `startDate`, `endDate` |
| `season-play-vv` | `seasonPlayVV` | 剧集/电影播放VV、播放UV、内容类型、题材、产地 | `startDate`, `endDate` |
| `per-capita-watch` | `perCapitaWatchDuration` | 短视频/剧集/电影/总人均观看时长 | `startDate`, `endDate` |
| `per-capita-play-count` | `perCapitaPlayCount` | 短视频/剧集/电影/总人均播放次数 | `startDate`, `endDate` |
| `season-type-play-ratio` | `seasonTypePlayRatio` | 按剧种播放UV、播放VV | `startDate`, `endDate` |
| `core-data` | `coreData` | 新增设备、日活设备、播放率 | `startDate`, `endDate`；需密码 |
| `play-top10` | `playTop10` | 剧集/电影、全部用户/新用户播放榜 | `date=yyyyMMdd` |
| `source-page-play` | `sourcePagePlayData` | 播放来源页面及播放量 | `startDate`, `endDate` |
| `available-play` | `availablePlayData` | 有效播放数、有效播放率、新设备播放率 | `startDate`, `endDate` |
| `search-click-conversion` | `searchClickConversion` | 点击搜索率、搜索完成率、搜索总/长视频转化率 | `startDate`, `endDate` |
| `season-search-auth` | `seasonSearchAuthInfo` | 季维度热搜：搜索排名、搜索UV/VV、权限、剧种、题材 | `date=yyyyMMdd` |
| `series-search-auth` | `seriesSearchAuthInfo` | 系列维度热搜与权限/播放排名 | `date=yyyyMMdd` |
| `search-keyword-series` | `searchKeywordSeries` | 搜索词-系列-季映射 | 无必填日期 |
| `member-revenue-attribution` | `memberRevenueAttribution` | 会员收益剧归因、订单、金额 | `startDate`, `endDate` |
| `popup-window` | `popupWindowData` | 弹窗曝光/点击/跳转播放/有效播放及转化率 | `startDate`, `endDate` |

### data_provider 关键字段映射

| 业务字段 | 原始字段 | 备注 |
|---|---|---|
| 日活设备 | `coreData.device_dau` | 设备口径，不是账号DAU |
| 新增设备 | `coreData.new_device` | 设备口径 |
| 播放率 | `coreData.play_rate` | 小数，展示时转百分比 |
| 播放UV | `seasonPlayVV.play_uv` | 剧集/电影维度 |
| 播放VV | `seasonPlayVV.play_count` | 播放次数 |
| 搜索UV | `seasonSearchAuthInfo.search_uv` | 季维度热搜 |
| 搜索VV | `seasonSearchAuthInfo.search_cnt` | 本项目将其展示为搜索VV |
| 内容类型 | `seasonSearchAuthInfo.drama_type` | 元数据匹配失败时为空 |
| 题材标签 | `seasonSearchAuthInfo.plot_type` | 原始逗号分隔标签 |
| 剧种 | `seasonSearchAuthInfo.season_type` | 中文剧种 |
| 首页Tab点击UV | `dramaConversion.tab_click_uv` | 首页频道/看剧转化口径，不等于 Quick BI 猜你喜欢页面值 |
| 首帧整体转化率 | `dramaConversion.first_frame_play_uv_rate` | 仅在该接口口径下使用 |
| 5分钟整体转化率 | `dramaConversion.play_5_mins_uv_rate` | 仅在该接口口径下使用 |
| 内容点击转化率 | `dramaConversion.content_click_uv_rate` | 仅在该接口口径下使用 |
| 播放转化率 | `dramaConversion.detail_play_uv_rate` | 详情尝试播放相关口径 |
| 有效播放转化率 | `dramaConversion.video_uv_rate` | 有效看剧相关口径 |
| 弹窗曝光UV | `popupWindowData.expost_uv` | 接口字段拼写为 `expost_uv` |
| 弹窗点击UV | `popupWindowData.click_uv` |  |
| 弹窗跳转播放UV | `popupWindowData.jump_uv` |  |
| 弹窗有效播放UV | `popupWindowData.play_uv` |  |
| 弹窗点击率 | `popupWindowData.ctr` | 点击UV / 曝光UV |
| 弹窗转化率 | `popupWindowData.conversion_rate` | 跳转UV / 点击UV |

## 3. quickbi-data MCP / Quick BI 页面索引

### 当前可确认的页面与字段

| Quick BI 页面/模块 | 可查询字段 | 状态 |
|---|---|---|
| 基础数据 → 日活数据 → 活跃明细 | 日期、活跃/新增及页面配置中的活跃明细字段 | 有 OLAP 查询模板；需有效 Cookie/CSRF 或 MCP连接 |
| 基础数据 → 留存分析 → 新账号留存 → 用户日留存 | 1留率、3留率及留存明细 | 目标页面已确认；当前未连接 MCP |
| 播放数据 → 播放排行榜 | 剧名、播放UV、播放VV、排名、内容类型、题材标签、剧种 | Quick BI 页面口径优先；与 `seasonPlayVV` 不自动混用 |
| 功能数据 → 搜索 → 搜索整体数据 | 日活、首帧播放UV整体转化率、播放5分钟UV整体转化率、进入搜索页UV、搜索页访问率、搜索完成UV、搜索完成UV转化率、影视点击UV、详情页起播UV、首帧转化率、播放5分钟UV、5分钟转化率、人均播放时长 | Quick BI 页面专属同口径组件；需 MCP/OLAP 查询 |
| 功能数据 → 猜你喜欢 → 首页数据 | 首页Tab点击、首帧整体转化率、5分钟整体转化率、内容曝光/点击、内容点击转化率、含广告/不含广告起播、播放转化率、有效播放等 | Quick BI 专属口径；不能用 `dramaConversion` 代替 |
| 功能数据 → 弹窗数据 | 组件名称、组件ID、曝光/点击/跳转播放/有效播放 UV/PV、点击率、转化率 | 页面专属口径以 MCP 为准；data_provider 有基础弹窗接口 |
| 页面数据 → 首页/频道漏斗 | 首页/频道曝光、点击、播放及转化字段 | 需按页面组件查询，不直接拼接 `section` 与 `dramaConversion` |
| 页面数据 → Banner/板块 | 位置、标题、曝光/点击、跳转播放、有效播放、CTR | 需按组件粒度核对 |

### Quick BI 本地复现信息

- 请求形态：`POST https://das.base.shuju.aliyun.com/api/v2/olap/query?menuId=...`
- 本地测试目录：`quickbi_test`
- 当前模板组件：`活跃明细`，不是留存/猜你喜欢组件模板。
- 认证不得写入索引：使用运行时的 `QUICKBI_COOKIE`、`QUICKBI_CSRF_TOKEN` 或受控 MCP连接。
- 没有对应组件的完整 OLAP 请求体时，不猜测 `componentId`、字段ID、筛选条件或口径。

## 4. 留存数据专用规则

> MCP 原生工具未加载时，先执行本文第 7 节连接恢复流程；不要直接判定服务不可用。

1. “新用户日留存”优先走 Quick BI 留存页面，不调用 `coreData` 或 `dramaConversion` 推算。
2. `1留率` 和 `3留率` 必须保留原始百分比/小数及日期；同时记录是账号还是设备去重。
3. 查询 2026-08-01 时，必须确认 Quick BI 返回的 cohort/date 字段确实为 `2026-08-01`，不能用页面最新日期替代。
4. Quick BI 未连接或字段缺失时返回“待接入”，不使用旧快照、mock值或相近指标。

## 5. 搜索整体数据专用规则

1. “搜索整体数据”必须使用 Quick BI 同一组件返回的整行字段，不能把 `searchClickConversion` 与 `dramaConversion` 的字段拼接成一行。
2. `searchClickConversion.search_complete_rate` 仅表示搜索完成率，不能反推出或替代 `搜索完成UV`。
3. `dramaConversion.first_frame_play_uv_rate`、`dramaConversion.play_5_mins_uv_rate` 是首页频道/看剧转化口径，不能替代搜索整体页面的首帧/5分钟转化率。
4. 2026-08-20 图示核验值（Quick BI 搜索整体数据）：搜索完成UV 203,315、搜索完成UV转化率 97.24%、影视点击UV 161,096、详情页起播UV 147,114、首帧转化率 70.36%、播放5分钟UV 71,035、5分钟转化率 33.97%、人均播放时长 47.11；这些是页面核验快照，不作为通用接口实时值。

## 6. 后续查询协议

每次查询按以下顺序执行：

1. 解析日期、客户端、平台、用户类型、频道/页面和指标粒度。
2. 先查本索引，选择唯一主数据源；需要跨源时明确字段分别来自哪一源。
3. data_provider 查询后校验响应日期、行数和字段。
4. Quick BI 查询后校验组件、筛选器、日期和原始字段。
5. 只有字段名、粒度、日期和口径全部一致时才合并；否则分别返回并解释差异。
6. 最终结果标注：来源、接口/组件、原始字段、日期、客户端/用户口径和缺失字段。

## 7. quickbi-data MCP 连接恢复流程（2026-09-10 实测）

### 7.1 已验证事实与凭证位置

- 服务地址：`http://101.132.68.174:8766/mcp`。
- 2026-09-10 使用用户授权的认证信息，通过 HTTP POST 完成 MCP `initialize`、`notifications/initialized` 和 `tools/list`；握手 HTTP 200，服务返回 `quickbi-data`，版本 `1.28.0`，协议版本 `2024-11-05`。
- 已发现 `recommend_data`（猜你喜欢），API_ID：`bf3f06e8eb6f`。本次验证到工具发现层，没有执行业务数据查询，不能视为任意日期的数据已经核验。
- 当时当前会话未暴露 quickbi-data 原生工具，本机 `C:\Users\tjldq\.codex\config.toml` 也未发现该服务配置，但直接 MCP 协议访问成功。工具未加载、配置缺失与远端服务不可达必须分别判断。
- 认证请求头为 `Authorization: Bearer <token>` 和 `userId: <user-id>`。严禁在本索引、代码、日志或提交中保存明文凭证。
- 后续优先从运行时的有效 Codex MCP 安全配置读取认证；也可约定通过 `QUICKBI_MCP_TOKEN`（仅 token，不含 Bearer 前缀）和 `QUICKBI_MCP_USER_ID` 环境变量提供。本次未创建这些环境变量，也未持久化凭证或修改 Codex 配置；不能假定下次已有凭证。

### 7.2 下次连接顺序

1. 先检查当前可调用工具是否包含 quickbi-data；存在时优先使用原生 MCP 工具。
2. 原生工具缺失时，检查有效 Codex 配置路径（包括 `CODEX_HOME` 指定的位置、用户及项目配置），仅输出服务地址、启用状态和认证字段是否存在，不输出认证值。历史配置片段使用过 `headers`；不得据此直接认定当前 Codex 版本的配置键有效，持久化前应核对当前支持的配置格式。
3. 有有效认证时，可在用户已授权的数据查询范围内直接使用上述地址进行只读 MCP 请求。原生工具缺失不必阻止这一连接验证。没有可读取的认证时，只报告缺少凭证，不从历史聊天或项目文档寻找旧明文值。
4. 每次 POST 使用 `Content-Type: application/json`、`Accept: application/json, text/event-stream`，以及认证请求头。先发送下面的初始化请求：

```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"codex-connectivity-check","version":"1.0"}}}
```

5. 核对初始化响应成功及协商协议版本。如果响应包含 `Mcp-Session-Id`，在后续请求中原样携带；会话 ID 不打印、不入库。按协商版本处理后续请求的 `MCP-Protocol-Version` 请求头。
6. 依次发送初始化完成通知和工具列表请求：

```json
{"jsonrpc":"2.0","method":"notifications/initialized"}
{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}
```

7. 响应可能是 SSE：读取 `data:` 中的 JSON-RPC 消息；也需支持普通 JSON。检查 JSON-RPC `error`，工具列表如有 `nextCursor` 则继续分页。只输出目标工具的名称、描述和输入 schema，避免整份工具目录造成输出截断。
8. 根据当次 `tools/list` 返回的 schema 构造 `tools/call`，不猜参数。查询前确认日期和筛选口径；查询后同时检查协议错误、`isError`、业务错误及真实响应字段。建议单次请求超时 25 秒；认证失败不盲目重试，网络超时可有限重试。
9. 如实报告连接方式为“直接 MCP 协议访问”；除非确已完成加载，不能说“当前会话原生工具已恢复”。索引记录连接方法，不会自动加载工具，也不保证凭证长期有效。

### 7.3 猜你喜欢：recommend_data

- 来源：`quickbi-data MCP` → `recommend_data`，API_ID `bf3f06e8eb6f`。
- 必填：`start_date`，格式 `yyyyMMdd`；选填：`end_date`、`client_type`、`source_type`、`app_version`、`new_or_old`。
- `client_type` 的合法值从 `client_type_list` 获取；`source_type` 不传默认为“猜你喜欢”，返回的 `page` 必须核对，不得默认认定为“首页”。
- `new_or_old` 为新老**设备**，可选 `new` / `old`，不传为全部；不得表述为新老账号或用户。
- 下表为本次工具描述声明的字段，业务响应仍需逐次核验；不能用历史截图填充缺失数据。

| 指标 | 原始字段 |
|---|---|
| 日期 | `date` |
| 页面 | `page` |
| 首页 Tab 点击 | `front_tab_uv` |
| 内容曝光 UV | `total_content_exposure_uv` |
| 内容点击 UV | `total_content_click_uv` |
| 内容点击转化率 UV | `total_content_click_rate` |
| 首帧播放整体转化率 | `ff_play_convert_rate` |
| 播放转化率 | `play_convert_rate` |
| 播放超过 5 分钟整体转化率 UV | `play_5min_rate_uv` |
| 人均播放时长 | `avg_time_uv` |

比例是小数还是百分数、时长单位及 UV 去重主体须根据实际响应和页面口径核验，不能仅凭字段名推断。PV、有效播放等未在本次工具描述列出的指标仍需另行核验，不可替代或推算。
