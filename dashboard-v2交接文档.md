# dashboard-v2 交接文档

> 用途：供新 Codex 对话继续维护当前看板。本文档记录当前工作区、数据来源、页面口径、已处理问题和接手后的验证步骤。

## 1. 项目定位

- 工作区：`C:\Users\tjldq\Documents\数据看板搭建`
- 看板目录：`C:\Users\tjldq\Documents\数据看板搭建\dashboard-v2`
- 页面入口：`dashboard-v2\index.html`
- 正确访问地址：<http://localhost:8000/dashboard-v2/>
- 当前 HTTP 服务端口：`8000`
- 数据目录：`dashboard-v2\data`
- 看板代码：
  - `dashboard-v2\index.html`
  - `dashboard-v2\app.js`
  - `dashboard-v2\style.css`
  - `dashboard-v2\echarts.min.js`

`dashboard-v2` 是独立于历史 `dashboard-demo` 和 V1 基线的当前看板。`dashboard-v1-baseline`、`dashboard-v1-original-baseline` 仅用于历史参考，不能直接覆盖当前 `dashboard-v2`。

## 2. 启动与访问

推荐从工作区父目录启动：

```powershell
cd "C:\Users\tjldq\Documents\数据看板搭建"
python -m http.server 8000 --directory "C:\Users\tjldq\Documents\数据看板搭建"
```

然后打开：

```text
http://localhost:8000/dashboard-v2/
```

检查 8000 端口：

```powershell
Get-NetTCPConnection -LocalPort 8000 -State Listen
Get-CimInstance Win32_Process -Filter "ProcessId=<PID>" | Select-Object ProcessId,CommandLine
```

注意：

- `http://localhost:8000/` 不一定是看板入口；必须带 `/dashboard-v2/`。
- 启动前先确认 8000 是否被旧的 `http.server` 占用，避免打开错误目录或错误版本。
- 当前 `dashboard-v2\README.md` 仍保留旧的 8015 端口说明，不能以它作为当前访问地址的依据。
- 修改 `app.js` 或 `index.html` 后，使用新的查询参数打开页面，例如：`?v=20260813-handoff`，避免浏览器缓存旧脚本。

## 3. 数据源原则

唯一数据基准是：

```text
C:\Users\tjldq\Documents\数据看板搭建\dashboard-v2\data\
```

这里的数据是从桌面真实数据文件整理后放入当前项目的数据目录。后续核对必须遵循：

```text
dashboard-v2\data\*.json
    -> app.js 数据读取与映射
    -> 页面字段、图表、表格
```

禁止：

- 使用 Quick BI 作为看板数据源或反向替代本地文件校验。
- 通过页面模拟点击取数。
- 未经用户明确要求探测后台接口。
- 修改 `dashboard-v2\data` 原始数据。
- 新增 Mock 数据或用其他字段替代缺失字段。
- 修改 Tab2、Tab3、Tab4 的数据口径来解决 Tab1 问题。

缺失字段应显示“暂无真实数据”或保持空值，不能擅自计算、填 0、换用 UV/PV 或其他相近字段。

## 4. Tab1 大盘总览

### 当前业务目标

Tab1 只保留三个分析区域：

1. 用户规模趋势分析
2. 用户消费深度分析
3. 安卓 / iOS / M站综合表现对比

第三个区域只保留两个并列标签：

- 设备 DAU
- 播放率 + 人均播放时长

不得恢复已经删除的重复趋势区块、重复的用户规模图、重复的消费深度图，或单独的人均播放次数页面。

### 数据文件与字段

| 页面模块 | 页面字段 | 来源文件 | 原始字段 | 日期/客户端口径 |
|---|---|---|---|---|
| 核心 KPI、用户规模趋势 | 设备 DAU | `new_people_video_device_dau_by_client_20260705_20260804.json` | `device_dau` | 2026-07-05 至 2026-08-04，按 `client` |
| 核心 KPI、用户规模趋势 | 新增设备 | `new_people_video_device_dau_by_client_20260705_20260804.json` | `new_device` | 同上 |
| 核心 KPI、消费深度 | 播放率 | `播放率_近30天_按客户端.json` | `play_rate` | 按 `client_type`，值为小数，展示时转百分比 |
| 核心 KPI、消费深度 | 人均播放时长 | `人均播放时长_近30天_按客户端.json` | `total_avg_watch_duration` | 按 `client_type`，展示为分钟 |
| 客户端对比历史数据 | 人均播放次数 | `avg_play_count_by_client.json` | 需先核对实际字段结构 | 仅作为历史核查参考；当前 Tab1 最新目标不单独展示该页面 |

页面日期范围默认是 `2026-07-04` 至 `2026-08-04`。任何 KPI 或趋势取最新值前，必须先执行 `date <= 页面结束日期` 过滤，禁止读取 2026-08-04 之后的数据。

客户端映射：

```text
安卓 -> client/client_type = 安卓
iOS  -> client/client_type = iOS
M站  -> client/client_type = M站
```

### 已确认值

2026-08-04：

| 客户端 | 设备 DAU | 新增设备 | 播放率 | 人均播放时长 | 人均播放次数历史核查值 |
|---|---:|---:|---:|---:|---:|
| 安卓 | 724,501 | 24,597 | 78.8% | 79.535 分钟 | 8.2042，展示通常为 8.204 |
| iOS | 548,038 | 29,464 | 75.3% | 52.84 分钟 | 7.556 |
| M站 | 107,973 | 数据需按当前文件复核 | 70.8% | 38.425 分钟 | 4.109 |

这些值只能用于回归核查，最终仍以 `dashboard-v2\data` 原始文件为准。

## 5. Tab2 内容榜单

来源文件：

```text
dashboard-v2\data\站内播放排名Top30_20260706_20260804.json
```

当前业务口径：每日 Top30 榜单快照。页面应保留原始记录，不合并同名内容，不重新计算排名，不用播放 VV 替代播放 UV。

| 页面字段 | 原始字段 |
|---|---|
| 日期 | `日期` |
| 排名 | `排名` |
| 内容名称 | `内容名称` |
| 播放 UV | `播放UV` |
| 播放 VV | `播放VV` |
| 昨日环比 | `昨日环比` |
| 聚集类型 | `聚集类型` |
| 内容分类 | `内容分类` |
| 题材标签 | `题材标签` |
| 榜单状态 | `榜单状态` |
| 数据状态 | `数据状态` |

已知榜单分类包括总榜和新用户榜；接手后必须确认页面子 Tab 与原始 `榜单分类` 的映射，不得把每日快照误当成一个去重后的内容总表。

默认展示最新可用日期的 Top30；如果需要展示历史日期，应按原始日期筛选，不改变原始排名。

## 6. Tab3 搜索分析

Tab3 当前使用不区分客户端的全部端口搜索数据，页面不应提供客户端切换。

### 使用率数据

| 页面模块 | 来源文件 | 原始字段 | 口径 |
|---|---|---|---|
| 全部用户搜索使用率 | `搜索使用率_全部端口_20260706_20260804.json` | `search_click_rate` | 全部端口；文件还含 `user_type`、`client`，需确认页面是否按用户类型读取 |
| 新用户搜索使用率 | `新用户搜索使用率_20260706_20260804.json` | `search_click_rate` | 全部端口 |
| 老用户搜索使用率 | `老用户搜索使用率_20260706_20260804.json` | `search_click_rate` | 全部端口 |

### 热搜明细

来源文件：

```text
dashboard-v2\data\热搜Top30_20260706_20260804.json
```

字段：

```text
date, rank, rank_change, title, search_count, search_uv,
day_over_day, content_type, topic_tag
```

热搜模块当前只保留热搜明细时，不能强制渲染 Top10 图表。热搜总榜、新用户热搜、老用户热搜必须分别确认原始数据是否存在对应分类；如果文件没有分类字段，不得用总榜数据冒充新用户或老用户榜。

搜索整体转化漏斗相关的搜索点击 UV、详情播放 UV、首帧播放 UV、5 分钟有效播放 UV 尚未完整接入真实数据。缺失时显示“暂无真实数据”，不要自行计算流失率或转化率。

## 7. Tab4 首页流量与转化漏斗

Tab4 使用全部端口/客户端明细视数据文件而定。不要把 Tab4 的客户端筛选逻辑套用到 Tab2、Tab3。

### 主要来源文件

| 页面模块 | 来源文件 | 主要字段 |
|---|---|---|
| 流量入口、漏斗 | `home_funnel_requested_fields.json` | `homepage_channel_click_uv`、`content_click_uv`、`detail_play_uv`、`play_over_5m_uv`、`effective_play_uv` 及原始 rate 字段 |
| 频道明细 | `home_channel_traffic_detail.json` | 日期、频道、客户端、设备及首页/内容/详情播放字段 |
| 首页板块 | `home_sections_risk_detail.json` | `board_name`、`sub_board_name`、曝光/点击 PV/UV、`click_ctr_uv`、风险字段 |
| Banner | `banner_click_detail.json` | 标题、位置、针次、频道、曝光/点击 PV/UV、`ctr_uv`、跳转播放量、有效播放量 |
| 猜你喜欢 UV | `guess_you_like_home_data.json` | 点击、播放、5 分钟播放、有效播放等 UV 字段 |
| 猜你喜欢 PV | `guess_you_like_pv_home_data.json` | 首页 Tab 曝光 PV、内容曝光 PV、内容点击 PV 等 PV 字段 |
| 猜你喜欢按端补充数据 | `guess_you_like_home_tab_click_uv_by_client_device_20260705_20260804.json` | 按客户端/设备拆分的猜你喜欢数据 |

Tab4 的频道排行曾出现“精选”重复累计：原始值为 `519,327`，错误页面值为 `1,038,654`。修复后的目标是每条原始记录只统计一次，不能把当前值与历史累计值再次相加。

Tab4 CTR 统一优先使用 UV 口径：

```text
首页板块排序与表格 -> click_ctr_uv
Banner 排序与表格 -> ctr_uv
```

不得图表使用 UV CTR、表格使用 PV CTR。漏斗如果无法确认全站聚合规则，保持“暂无真实转化率”，不要用分频道 rate 直接相加或自行计算全站转化率。

## 8. 已处理问题与回归要求

- Tab1 人均播放次数曾因 `latest(counts)` 未先按结束日期过滤而读取到 2026-08-06；修复后必须先按页面结束日期过滤。
- Tab4 频道排行重复累计已按“每条原始记录只统计一次”处理，精选目标值为 519,327。
- Tab1 客户端状态文字曾与数据筛选不同步，客户端文字、KPI、图表必须共用同一个 `state.client`。
- Tab1 播放率统一按百分比展示，例如 78.8%、75.3%、70.8%，不能把 0.788 直接作为运营展示值。
- Tab4 板块与 Banner CTR 必须统一 UV 口径。
- 搜索与首页漏斗缺失数据不得填 0、不得用相近指标替代。

## 9. 当前代码风险

`dashboard-v2\app.js` 存在多层历史 `renderOverview`、`renderPage` 覆盖和兼容代码。后续维护时：

- 不要继续在文件末尾追加新的渲染覆盖。
- 先定位最终实际生效的渲染函数，再删除或收敛旧逻辑。
- 必须避免多个 `.overview-regions` 同时存在。
- 当前 Tab1 最终验收目标是一个 `.overview-regions`，其中三个 `.overview-region`，第三个区域只有两个客户端标签。
- 最近一次“删除重复 Tab1 内容”的浏览器验证因浏览器会话中断，接手后必须重新验证。
- 不要用历史 V1 基线直接覆盖 `dashboard-v2`。

## 10. 接手后的验证流程

### 静态检查

```powershell
cd "C:\Users\tjldq\Documents\数据看板搭建\dashboard-v2"
node --check app.js
```

### Tab1 DOM 检查

在全新浏览器标签打开带缓存参数的看板后，执行：

```javascript
document.querySelectorAll('#page-overview .overview-regions').length
document.querySelectorAll('#page-overview .overview-region').length
```

预期分别为：`1`、`3`。

第三个区域预期只出现：

```text
设备 DAU
播放率 + 人均播放时长
```

不应出现重复的旧区域、单独的人均播放时长/人均播放次数区域或第二套 `.overview-regions`。

### 客户端验证

依次切换安卓、iOS、M站，确认：

- 当前客户端文字同步。
- KPI 同步变化。
- 用户规模趋势同步变化。
- 消费深度图同步变化。
- 第三个区域的两个子页面数据同步变化。
- 人均播放次数不会读取页面结束日期之后的数据。

### 其他 Tab 回归

- Tab2：总榜、新用户榜和每日快照仍使用原始排名与原始记录。
- Tab3：数据保持全部端口，不出现客户端筛选；缺失漏斗字段仍显示暂无真实数据。
- Tab4：精选频道不重复累计，板块/Banner CTR 保持 UV 口径，猜你喜欢 PV 不用 UV 替代。

### 证据

验证完成后保存：

- 页面截图
- 控制台/DOM 检查结果
- 发现的问题及对应来源文件

参考资料仅包括历史截图和视频，不作为数据源：

```text
C:\Users\tjldq\Videos\Captures\视频产品运营驾驶舱 - Google Chrome 2026-08-13 14-56-14.mp4
C:\Users\tjldq\Documents\数据看板搭建\dashboard-v2数据验收报告.docx
```

## 11. 接手原则

新 Codex 开始工作时，先阅读本文档，再检查：

1. 当前服务实际指向的目录。
2. `index.html` 加载的 `app.js` 版本和缓存参数。
3. `app.js` 最终生效的 `renderPage` / `renderOverview`。
4. `dashboard-v2\data` 中对应文件的真实字段和日期范围。
5. Tab1 的 DOM 是否只有一个三段式布局。

任何修改都必须限定在用户明确要求的 Tab 和逻辑范围内。不要因为历史截图、旧版本或 Quick BI 页面看起来不同，就擅自恢复旧 UI、修改其他 Tab 或改变字段口径。
