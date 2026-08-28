# Signal Studio：海外影视内容运营 AI 工作台

这是一个面向“海外影视内容运营 / AI内容运营”岗位的作品集项目。它不是一次性爬虫或静态看板，而是一条可运行、可追溯的业务闭环：

```text
YouTube官方API → 原始JSON留档 → 清洗/内容分类 → SQLite历史沉淀
→ TMDb影视语境补全 → FastAPI业务接口 → React运营工作台
→ DeepSeek生成有证据的选题Brief → CSV/Markdown复盘导出
```

## 与岗位JD的对应关系

| JD能力 | 系统证明 |
|---|---|
| 海外影视竞品监测 | 按频道批量采集公开视频和指标，默认30条且可配置 |
| 热点追踪与运营复盘 | 热度排序、互动率、48小时新内容、指标历史与运行记录 |
| 影视内容理解 | TMDb项目、类型、国家、语言、演员主创与频道覆盖 |
| 选题、包装与分发 | 内容类型分类、标题方向、标签、时长和发布时间建议 |
| AI内容生产 | DeepSeek基于1—5条真实证据生成结构化Brief |
| 数据合规和可信度 | 官方API优先、原始数据留档、事实/假设分离、密钥后端隔离 |

## 系统架构

```text
YouTube Data API / TMDb API
             ↓
       Python采集流水线
             ↓
 SQLite（当前值 + 指标历史 + 任务 + AI记录）
             ↓
        FastAPI本地后端
             ↓
       React / Vite工作台
             ↓
 DeepSeek Brief / CSV / Markdown
```

公开作品集与本地完整系统严格分离：

- **本地完整系统**：可采集、查看日志、调用DeepSeek和下载导出文件。
- **公开静态站**：只包含脱敏数据快照，隐藏采集、日志和在线AI按钮，不携带任何密钥。

## 五个业务模块

1. **运营总览**：频道、视频、播放、互动、48小时新内容、趋势和高潜内容。
2. **竞品视频库**：标题搜索，频道/类型/项目/时间筛选，历史指标、运营判断和YouTube跳转。
3. **影视项目情报库**：TMDb资料、演员主创、评分热度、关联视频和频道覆盖。
4. **AI选题助手**：选择1—5条证据，生成标题、钩子、结构、时长、标签、发布时间建议、风险和数据缺口。
5. **数据与任务**：本地采集、任务进度、失败原因、日志预览、运行历史及成果下载。

## 数据口径

- 唯一键：`platform + video_id`。
- Upsert：重复采集更新视频当前值，不新增重复视频。
- 历史：每次运行向`video_metrics`新增指标快照；同一运行重复写入保持幂等。
- 互动率：`(点赞数 + 评论数) / 播放量`。
- 内容分类：可解释关键词与时长规则，记录方法和置信度；类型包括预告、片段、幕后、采访、官宣、短视频和其他。
- 热度分：播放、互动、时效和TMDb语境的运营排序分，不等同于平台官方热度。

## 快速运行

### 1. 安装依赖

```powershell
python -m pip install -r requirements.txt
cd dashboard_web
npm install
cd ..
```

### 2. 配置环境变量

复制`.env.example`为`.env`，只填写自己实际使用的密钥：

```env
YOUTUBE_API_KEY=your_youtube_key
TMDB_API_KEY=your_tmdb_key
DEEPSEEK_API_KEY=your_deepseek_key
DEEPSEEK_MODEL=deepseek-chat
AI_TIMEOUT_SECONDS=60
API_PROXY=
```

`.env`已被Git忽略。不要截图、提交或把密钥放进React代码。

### 3. 初始化和采集

```powershell
python run.py init
python run.py pipeline --limit 30
```

常用选项：

```powershell
# 使用已有数据，重新分析、入库、导出和刷新前端快照
python run.py pipeline --skip-fetch --skip-tmdb

# 临时改为每频道10条
python run.py pipeline --limit 10

# 跳过TMDb请求
python run.py pipeline --limit 30 --skip-tmdb
```

`channels.txt`每行一个`@handle`。单个频道或TMDb请求失败会写入日志，任务以`partial_success`结束，不会静默忽略。

### 4. 启动后端与前端

终端一：

```powershell
python run.py api --host 127.0.0.1 --port 8000
```

终端二：

```powershell
cd dashboard_web
npm run dev
```

- 工作台：[http://127.0.0.1:5173](http://127.0.0.1:5173)
- API文档：[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

## 核心API

所有JSON接口统一返回：`{"code": 0, "message": "success", "data": ...}`。

| 方法 | 路径 | 用途 |
|---|---|---|
| GET | `/api/overview` | 总览、频道、趋势、异常 |
| GET | `/api/videos` | 搜索、筛选、排序和分页 |
| GET | `/api/videos/{platform}/{video_id}` | 视频详情和指标历史 |
| GET | `/api/titles/{tmdb_id}` | 影视资料、关联视频和频道覆盖 |
| GET/POST | `/api/ai/briefs` | 回看/生成可追溯Brief |
| POST | `/api/tasks/collect` | 本机异步采集 |
| GET | `/api/tasks/{run_id}` | 查询采集状态 |
| GET | `/api/exports/*` | 下载CSV与Markdown |
| GET | `/api/logs/recent` | 本机脱敏日志预览 |

采集、日志、导出和AI写操作只允许本机访问。

## AI质量约束

模型输入只包含已验证的视频指标和TMDb资料。输出必须分成：

- `evidence`：可追溯到视频ID的事实；
- `operational_hypotheses`：仍需运营验证的假设；
- `risks`：版权、时效和因果解释风险；
- `data_gaps`：地区、分享、评论语义等缺失数据；
- `confidence`：基于证据覆盖度的置信度。

DeepSeek超时、无密钥或返回异常时自动使用规则建议，并明确标记`rule_fallback`，不会伪装为大模型结果。

## 工程目录

```text
backend/                  采集、分类、分析、SQLite、FastAPI、AI与导出
dashboard_web/            React/Vite五模块工作台与公开数据快照
data/raw/                 时间戳原始API响应（本地，不提交）
data/clean/               清洗后的阶段数据
data/final/               合并数据和运营推荐
data/exports/             视频CSV、推荐CSV与运营报告
data/database/            SQLite数据库（本地，不提交）
docs/                     数据流、指标、面试演示和截图
tests/                    API链路、分类、Upsert和接口测试
channels.txt              默认监测频道
title_keywords.csv        经人工审核的标题—TMDb实体映射
```

## 测试、构建与安全检查

```powershell
python -m unittest discover -s tests -v
cd dashboard_web
npm run build
cd ..
python backend/check_frontend_secrets.py
```

生产构建自动读取`dashboard_web/.env.production`，启用公开快照模式。`dist`不得出现API Key、Cookie、Token、`.env`或本地绝对路径。

## 当前样例数据

- 3个YouTube频道；
- 30条视频；
- 90条指标历史快照；
- 11个TMDb项目；
- 17条视频—影视关联；
- 9条历史AI Brief（数量会随本地使用变化）。

样例仅用于作品集演示，不代表完整市场结论。Google Trends、TikTok和Instagram属于后续数据源。

## 面试演示

参见[docs/interview_demo.md](docs/interview_demo.md)。建议按“总览发现机会 → 视频证据 → 影视语境 → AI Brief → 数据追溯与导出”的顺序演示。

## 数据与图片署名

视频数据和缩略图来自YouTube Data API；影视资料及海报来自TMDb。本产品使用TMDb API，但未经TMDb认可或认证。正式商业使用需继续遵守各平台条款和素材版权要求。
