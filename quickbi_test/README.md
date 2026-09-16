# Quick BI 内部查询接口复现测试

本目录只验证 Python 是否可以复现 Quick BI 页面背后的 OLAP 查询请求。

不开发完整 pipeline，不修改 Dashboard，不写 Mock 数据。

## 文件

```text
quickbi_test/
├── test_quickbi_query.py
└── README.md
```

## 请求目标

```text
POST https://das.base.shuju.aliyun.com/api/v2/olap/query?menuId=p3lqatn18k
```

固定测试参数：

```text
reportId: 19c5b754-e0e7-4853-b4ae-f9589f1b8bbf
componentId: e279dd0a-12ae-4fdf-aa79-46589dc1804d
cubeId: 839ed3d1-3b1f-4a53-9594-b00593a608ae
menuId: p3lqatn18k
```

## 认证

禁止把 Cookie、CSRF token 写死在代码或文件中。

脚本优先使用环境变量；未设置时，会直接从 `Cookie.txt` 的完整 Copy as cURL 请求中读取 Cookie 和 CSRF，仅在当前进程内使用，不写入 payload 模板、响应日志或 Dashboard 数据文件。

可选环境变量：

```powershell
$env:QUICKBI_COOKIE = "从浏览器请求头复制的 Cookie"
$env:QUICKBI_CSRF_TOKEN = "从浏览器请求头或页面请求中复制的 csrf token"
```

`Cookie.txt` 必须包含目标组件的完整 OLAP 请求体；脚本不会猜测组件 ID、字段 ID 或筛选条件。

## 运行

```powershell
python test_quickbi_query.py
```

如果系统没有 `python` 命令，可使用 Codex 内置 Python 路径运行。

## 成功输出

成功时会保存：

```text
quickbi_test/response.json
```

并输出：

- HTTP 状态码
- success 字段
- 返回数据结构
- 是否包含真实数据

## 失败处理

失败时脚本只输出：

```text
【阻塞】
原因：
需要的信息：
```

常见原因：

- Cookie 失效
- csrf token 错误或缺失
- payload 缺失或不完整
- 当前账号无该组件查询权限
