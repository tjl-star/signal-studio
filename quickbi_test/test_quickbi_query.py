import json
import os
import re
import sys
from pathlib import Path
from urllib.parse import parse_qs, unquote_plus, urlencode
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError


COOKIE_CURL_PATH = Path(r"C:\Users\tjldq\Desktop\Cookie.txt")
SCRIPT_DIR = Path(__file__).resolve().parent
PAYLOAD_TEMPLATE_PATH = SCRIPT_DIR / "payload_template.json"
RESPONSE_PATH = SCRIPT_DIR / "response.json"


def block(reason, needed):
    print("【阻塞】")
    print(f"原因：{reason}")
    print("需要的信息：")
    for item in needed:
        print(f"- {item}")
    return 1


def clean_windows_curl(text):
    cleaned = text.replace("^\r\n", " ").replace("^\n", " ")
    cleaned = cleaned.replace('^"', '"')
    cleaned = cleaned.replace("^&", "&")
    cleaned = cleaned.replace("^", "")
    return cleaned


def extract_quoted_after(option, text):
    pattern = rf"{re.escape(option)}\s+\"([\s\S]*?)\""
    match = re.search(pattern, text)
    return match.group(1) if match else None


def extract_curl_parts(path):
    if not path.exists():
        raise ValueError(f"未找到文件：{path}")

    raw = path.read_text(encoding="utf-8", errors="replace")
    text = clean_windows_curl(raw)

    url_match = re.search(r'curl\s+"([^"]+)"', text) or re.search(r"curl\s+'([^']+)'", text)
    url = url_match.group(1) if url_match else None

    headers = {}
    for match in re.finditer(r'-H\s+"([^"]+)"', text):
        header = match.group(1)
        if ":" not in header:
            continue
        name, value = header.split(":", 1)
        headers[name.strip()] = value.strip()

    cookie_from_b = extract_quoted_after("-b", text)
    data_raw = extract_quoted_after("--data-raw", text)

    if not url:
        raise ValueError("cURL 中未识别到 URL")
    if not data_raw:
        raise ValueError("cURL 中未识别到 --data-raw payload")

    return {
        "url": url,
        "headers": headers,
        "cookie": cookie_from_b,
        "data_raw": data_raw,
    }


def decode_form_payload(data_raw):
    parsed = parse_qs(data_raw, keep_blank_values=True)
    payload = {key: values[0] if len(values) == 1 else values for key, values in parsed.items()}
    if "olapQueryParam" in payload:
        try:
            payload["olapQueryParam"] = json.loads(unquote_plus(payload["olapQueryParam"]))
        except json.JSONDecodeError:
            payload["olapQueryParam_raw"] = payload["olapQueryParam"]
    return payload


def encode_form_payload(payload):
    encoded = {}
    for key, value in payload.items():
        if key == "olapQueryParam" and isinstance(value, (dict, list)):
            encoded[key] = json.dumps(value, ensure_ascii=False, separators=(",", ":"))
        elif key.endswith("_raw"):
            continue
        else:
            encoded[key] = value
    return encoded


def write_payload_template(parts, payload):
    safe_headers = {}
    for key, value in parts["headers"].items():
        lowered = key.lower()
        if lowered in {"cookie", "x-csrf-token", "x-xsrf-token", "csrf-token"}:
            continue
        safe_headers[key] = value

    template = {
        "url": parts["url"],
        "method": "POST",
        "headers_without_auth": safe_headers,
        "payload": payload,
        "notes": [
            "Cookie 与 CSRF 不保存在本文件。",
            "真实请求时从 QUICKBI_COOKIE / QUICKBI_CSRF_TOKEN 环境变量读取。",
        ],
    }
    PAYLOAD_TEMPLATE_PATH.write_text(json.dumps(template, ensure_ascii=False, indent=2), encoding="utf-8")


def response_has_real_data(value):
    if isinstance(value, list):
        return bool(value) or any(response_has_real_data(item) for item in value)
    if not isinstance(value, dict):
        return False

    strong_keys = {
        "rows",
        "records",
        "data",
        "result",
        "values",
        "columns",
        "dataList",
        "content",
        "list",
        "items",
    }
    for key, item in value.items():
        if key in strong_keys and item not in (None, [], {}):
            return True
        if response_has_real_data(item):
            return True
    return False


def summarize_response(value, depth=0):
    if depth >= 3:
        return type(value).__name__
    if isinstance(value, dict):
        return {key: summarize_response(item, depth + 1) for key, item in list(value.items())[:25]}
    if isinstance(value, list):
        return [summarize_response(value[0], depth + 1)] if value else []
    return type(value).__name__


def main():
    try:
        parts = extract_curl_parts(COOKIE_CURL_PATH)
        payload = decode_form_payload(parts["data_raw"])
    except ValueError as exc:
        return block(str(exc), ["确认 Cookie.txt 是完整 Copy as cURL 内容"])

    write_payload_template(parts, payload)

    header_lookup = {key.lower(): value for key, value in parts["headers"].items()}
    csrf_token = (
        os.getenv("QUICKBI_CSRF_TOKEN")
        or header_lookup.get("x-csrf-token")
        or header_lookup.get("x-xsrf-token")
        or header_lookup.get("csrf-token")
    )
    cookie = os.getenv("QUICKBI_COOKIE") or parts["cookie"] or header_lookup.get("cookie")
    missing = []
    if not cookie:
        missing.append("cURL 的 Cookie（或环境变量 QUICKBI_COOKIE）")
    if not csrf_token:
        missing.append("cURL 的 CSRF 请求头（或环境变量 QUICKBI_CSRF_TOKEN）")
    if "olapQueryParam" not in payload:
        missing.append("cURL payload 中的 olapQueryParam")
    if missing:
        return block("缺少认证信息或核心 payload，未发起真实请求", missing)

    headers = dict(parts["headers"])
    headers["Cookie"] = cookie
    headers["x-csrf-token"] = csrf_token
    headers.pop("content-length", None)
    headers.pop("Content-Length", None)

    request_payload = encode_form_payload(payload)
    encoded_body = urlencode(request_payload).encode("utf-8")

    try:
        try:
            import requests

            response = requests.post(parts["url"], headers=headers, data=request_payload, timeout=30)
            status_code = response.status_code
            response_text = response.text
        except ModuleNotFoundError:
            request = Request(parts["url"], data=encoded_body, headers=headers, method="POST")
            with urlopen(request, timeout=30) as response:
                status_code = response.status
                response_text = response.read().decode("utf-8", errors="replace")
    except HTTPError as exc:
        status_code = exc.code
        response_text = exc.read().decode("utf-8", errors="replace")
    except URLError as exc:
        return block(f"请求失败：{exc}", ["确认网络可访问 Quick BI", "确认 Cookie / CSRF 未过期"])

    print(f"HTTP状态码：{status_code}")

    try:
        response_json = json.loads(response_text)
    except ValueError:
        return block("响应不是 JSON", [f"HTTP状态码：{status_code}", f"返回错误：{response_text[:500]}"])

    success = response_json.get("success")
    if success is None:
        success = response_json.get("code") in ("0000", "0", 0)

    has_data = response_has_real_data(response_json)
    print(f"success字段：{success}")
    print("返回数据结构：")
    print(json.dumps(summarize_response(response_json), ensure_ascii=False, indent=2))
    print(f"是否包含真实业务数据字段：{has_data}")

    if status_code == 200 and has_data:
        RESPONSE_PATH.write_text(json.dumps(response_json, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"已保存：{RESPONSE_PATH}")
        return 0

    reason_parts = [f"HTTP状态码：{status_code}", f"success字段：{success}", f"是否包含真实数据：{has_data}"]
    if isinstance(response_json, dict):
        for key in ("message", "msg", "error", "errorMsg", "code"):
            if key in response_json:
                reason_parts.append(f"{key}：{response_json[key]}")
    return block(
        "；".join(reason_parts),
        ["确认 Cookie 未失效", "确认 QUICKBI_CSRF_TOKEN 正确", "确认 olapQueryParam 是该组件完整请求体", "确认账号有查询权限"],
    )


if __name__ == "__main__":
    sys.exit(main())
