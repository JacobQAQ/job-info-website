"""
求职方舟校招汇总表爬虫 (Python)
从 https://www.qiuzhifangzhou.com/campus 抓取表格数据，导出为 Excel。
优先拦截 API 响应获取 JSON，否则解析页面表格。

使用前请安装：
  pip install playwright openpyxl
  python -m playwright install chromium
运行：python scrape_campus.py
"""
import json
import os
import sys

import openpyxl
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout


CAMPUS_URL = "https://www.qiuzhifangzhou.com/campus"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "backend", "uploads")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "jobs.xlsx")

EXCEL_HEADERS = ["更新日期", "公司", "行业", "标签", "批次", "职位", "地点", "投递截止", "操作"]


def ensure_output_dir():
    os.makedirs(OUTPUT_DIR, exist_ok=True)


def _parse_api_payload(body):
    """从 API 响应 JSON 中解析列表数据，返回 [dict, ...]。"""
    try:
        obj = json.loads(body)
    except Exception:
        return []
    if not isinstance(obj, dict):
        return []
    # 嵌套 { data: { list: [...] } }
    inner = obj.get("data")
    if isinstance(inner, dict):
        for k in ("list", "records", "rows", "data"):
            arr = inner.get(k)
            if isinstance(arr, list) and arr and isinstance(arr[0], dict):
                return arr
    # 顶层 list
    for key in ("data", "list", "records", "rows", "result"):
        arr = obj.get(key)
        if isinstance(arr, list) and arr and isinstance(arr[0], dict):
            return arr
    return []


def _api_row_to_excel(item):
    """将 API 单条记录转换为 Excel 行字典。"""
    def s(v):
        return str(v).strip() if v is not None else ""

    # 常见字段名（中英）
    name_map = [
        ("更新日期", "updateTime", "update_time", "date", "时间", "updatedAt"),
        ("公司", "company", "companyName", "公司名称", "corp"),
        ("行业", "industry", "industryTag", "行业标签"),
        ("标签", "tags", "tag", "batch", "批次"),
        ("批次", "batch", "批次", "batchName"),
        ("职位", "position", "job", "title", "热门职位", "jobName"),
        ("地点", "location", "city", "address", "工作地点"),
        ("投递截止", "deadline", "endTime", "截止"),
        ("操作", "url", "link", "applyUrl", "投递链接", "公告链接", "href"),
    ]
    row = {h: "" for h in EXCEL_HEADERS}
    for header, *keys in name_map:
        for k in keys:
            v = item.get(k)
            if v is not None and str(v).strip():
                row[header] = s(v)
                break
    return row


def extract_via_api_intercept(page):
    """拦截请求，收集疑似列表 API 的 JSON，解析为行。"""
    collected = []
    seen = set()

    def on_response(response):
        try:
            url = response.url
            if response.status != 200:
                return
            if "api" not in url.lower() and "list" not in url.lower() and "campus" not in url.lower():
                return
            ct = response.headers.get("content-type") or ""
            if "json" not in ct:
                return
            raw = response.body()
            body = raw.decode("utf-8", errors="ignore") if raw else ""
            if not body or len(body) < 50:
                return
            rows = _parse_api_payload(body)
            for r in rows:
                if not isinstance(r, dict):
                    continue
                row = _api_row_to_excel(r)
                key = (row.get("公司") or "", row.get("操作") or "", row.get("职位") or "")
                if key in seen:
                    continue
                seen.add(key)
                if any(row.values()):
                    collected.append(row)
        except Exception:
            pass

    page.on("response", on_response)
    return collected


def extract_table_via_playwright():
    """打开页面，优先从 API 解析，否则从 DOM 表格解析。"""
    api_rows = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        )
        page = context.new_page()
        api_rows = extract_via_api_intercept(page)

        try:
            page.goto(CAMPUS_URL, wait_until="networkidle", timeout=60000)
        except PlaywrightTimeout:
            page.goto(CAMPUS_URL, wait_until="domcontentloaded", timeout=30000)

        page.wait_for_timeout(3000)

        if api_rows:
            browser.close()
            return api_rows

        data = []
        for sel in ["table tbody tr", ".ant-table-tbody tr", "table tr"]:
            rows = page.query_selector_all(sel)
            if not rows:
                continue
            for tr in rows:
                cells = tr.query_selector_all("td")
                if not cells:
                    continue
                texts = [c.inner_text().strip() for c in cells]
                links = []
                for a in tr.query_selector_all("a[href]"):
                    href = (a.get_attribute("href") or "").strip()
                    if href.startswith("http"):
                        links.append(href)
                row = map_row(texts, links)
                if any(row.values()):
                    data.append(row)
            if data:
                break

        browser.close()
        return data


def map_row(cell_texts, links):
    """将表格单元格与链接映射为 Excel 行。方舟列序：更新 公司 公告 投递 行业 批次 职位 地点。"""
    def take(i, default=""):
        if i < len(cell_texts):
            return (cell_texts[i] or "").strip() or default
        return default

    apply_link = ""
    for href in links:
        if "apply" in href.lower() or "job" in href.lower() or "zhaopin" in href or "campus" in href or "career" in href:
            apply_link = href
            break
    if not apply_link and links:
        apply_link = links[0]

    return {
        "更新日期": take(0),
        "公司": take(1),
        "行业": take(4) or take(2),
        "标签": take(5) or take(3),
        "批次": take(5) or take(4),
        "职位": take(6) or take(5),
        "地点": take(7) or take(6),
        "投递截止": "",
        "操作": apply_link,
    }


def save_to_excel(rows):
    ensure_output_dir()
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "求职信息"
    ws.append(EXCEL_HEADERS)
    for r in rows:
        ws.append([r.get(h, "") for h in EXCEL_HEADERS])
    column_widths = {"A": 12, "B": 15, "C": 12, "D": 15, "E": 12, "F": 20, "G": 15, "H": 12, "I": 36}
    for col, w in column_widths.items():
        ws.column_dimensions[col].width = w
    wb.save(OUTPUT_FILE)
    return OUTPUT_FILE


def main():
    print("正在打开求职方舟校招页并抓取表格...")
    try:
        data = extract_table_via_playwright()
    except Exception as e:
        print(f"抓取失败: {e}", file=sys.stderr)
        sys.exit(1)

    if not data:
        print("未解析到任何表格行，请检查页面结构或是否需登录。")
        sys.exit(1)

    path = save_to_excel(data)
    print(f"已保存 {len(data)} 条记录到 {path}")


if __name__ == "__main__":
    main()
