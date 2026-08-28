# Signal Studio 项目导航

这是一个包含多套运营工具的单仓库。各项目彼此独立，按目录进入即可，不要把仓库根目录当作某一套看板的运行目录。

## 当前正式看板

### `dashboard-v2`：新版视频运营数据看板

这是当前使用的新版看板，包含运营总览、用户与内容、搜索运营、弹窗数据等模块，并内置可直接打开的本地数据快照。

- [进入新版看板目录](dashboard-v2/)
- [新版看板运行说明](dashboard-v2/README.md)
- Windows：进入 `dashboard-v2` 后双击 `启动看板.bat`
- 通用运行方式：

  ```powershell
  cd dashboard-v2
  python -m http.server 8000
  ```

  然后打开 <http://127.0.0.1:8000/>。

## 仓库内其他项目

### `dashboard_web`：旧版 React/Vite 工作台

原有的海外影视内容运营 AI 工作台，依赖 Python 后端和 Node.js 前端环境。它与 `dashboard-v2` 相互独立，除非需要维护旧版，否则请优先使用新版看板。

### `backend`：采集与业务后端

提供数据采集、清洗、SQLite、FastAPI、AI 选题和导出能力，主要服务于 `dashboard_web`，不属于新版静态看板的启动依赖。

## 公共目录

| 目录 | 用途 |
|---|---|
| `data/` | 原始数据、清洗数据和导出数据 |
| `docs/` | 数据流、指标口径和演示文档 |
| `tests/` | 后端和数据链路测试 |

## 如何选择

| 需求 | 进入目录 |
|---|---|
| 查看当前新版运营看板 | `dashboard-v2/` |
| 维护旧版 React 工作台 | `dashboard_web/` |
| 运行采集、API 或 AI 流程 | `backend/` 与根目录 `run.py` |

新版看板的数据快照已随 `dashboard-v2` 一并提交，下载该目录即可运行，不需要配置接口 Token。
