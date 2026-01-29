/**
 * 求职方舟校招汇总表爬虫 (Node.js)
 * 从 https://www.qiuzhifangzhou.com/campus 抓取表格，导出 Excel 到 backend/uploads/jobs.xlsx
 * 运行：在项目根目录执行 npm run scrape 或在 backend 目录执行 node scripts/scrape_campus.js
 */

const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

const CAMPUS_URL = 'https://www.qiuzhifangzhou.com/campus';
const HEADERS = ['更新日期', '公司', '行业', '标签', '批次', '职位', '地点', '投递截止', '操作'];

function ensureUploadsDir() {
  const dir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function parseApiPayload(body) {
  let obj;
  try {
    obj = typeof body === 'string' ? JSON.parse(body) : body;
  } catch {
    return [];
  }
  if (!obj || typeof obj !== 'object') return [];
  const inner = obj.data;
  if (inner && typeof inner === 'object') {
    for (const k of ['list', 'records', 'rows', 'data']) {
      const arr = inner[k];
      if (Array.isArray(arr) && arr.length && typeof arr[0] === 'object') return arr;
    }
  }
  for (const key of ['data', 'list', 'records', 'rows', 'result']) {
    const arr = obj[key];
    if (Array.isArray(arr) && arr.length && typeof arr[0] === 'object') return arr;
  }
  return [];
}

function apiRowToExcel(item) {
  const s = (v) => (v != null ? String(v).trim() : '');
  const row = {};
  const map = [
    ['更新日期', 'updateTime', 'update_time', 'date', '时间', 'updatedAt'],
    ['公司', 'company', 'companyName', '公司名称', 'corp'],
    ['行业', 'industry', 'industryTag', '行业标签'],
    ['标签', 'tags', 'tag', 'batch', '批次'],
    ['批次', 'batch', '批次', 'batchName'],
    ['职位', 'position', 'job', 'title', '热门职位', 'jobName'],
    ['地点', 'location', 'city', 'address', '工作地点'],
    ['投递截止', 'deadline', 'endTime', '截止'],
    ['操作', 'url', 'link', 'applyUrl', '投递链接', '公告链接', 'href'],
  ];
  for (const [h, ...keys] of map) {
    row[h] = '';
    for (const k of keys) {
      const v = item[k];
      if (v != null && String(v).trim()) {
        row[h] = s(v);
        break;
      }
    }
  }
  return row;
}

function mapDomRow(texts, links) {
  const take = (i, d = '') => (i < texts.length && texts[i] ? String(texts[i]).trim() : d) || d;
  let apply = '';
  for (const href of links) {
    if (/apply|job|zhaopin|campus|career/i.test(href)) {
      apply = href;
      break;
    }
  }
  if (!apply && links.length) apply = links[0];
  return {
    更新日期: take(0),
    公司: take(1),
    行业: take(4) || take(2),
    标签: take(5) || take(3),
    批次: take(5) || take(4),
    职位: take(6) || take(5),
    地点: take(7) || take(6),
    投递截止: '',
    操作: apply,
  };
}

async function scrape() {
  const { chromium } = require('playwright');
  const apiRows = [];
  const seen = new Set();

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await ctx.newPage();

  page.on('response', async (res) => {
    try {
      const url = res.url();
      if (res.status() !== 200) return;
      if (!/api|list|campus/i.test(url)) return;
      const ct = res.headers()['content-type'] || '';
      if (!/json/.test(ct)) return;
      const body = await res.body();
      const text = (body && body.length) ? body.toString('utf8') : '';
      if (!text || text.length < 50) return;
      const rows = parseApiPayload(text);
      for (const r of rows) {
        if (typeof r !== 'object') continue;
        const row = apiRowToExcel(r);
        const key = `${row.公司 || ''}\t${row.操作 || ''}\t${row.职位 || ''}`;
        if (seen.has(key)) continue;
        seen.add(key);
        if (Object.values(row).some(Boolean)) apiRows.push(row);
      }
    } catch (_) {}
  });

  await page.goto(CAMPUS_URL, { waitUntil: 'networkidle', timeout: 60000 }).catch(() =>
    page.goto(CAMPUS_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
  );
  await page.waitForTimeout(3000);

  if (apiRows.length) {
    await browser.close();
    return apiRows;
  }

  const domRows = [];
  for (const sel of ['table tbody tr', '.ant-table-tbody tr', 'table tr']) {
    const trs = await page.$$(sel);
    for (const tr of trs) {
      const tds = await tr.$$('td');
      if (!tds.length) continue;
      const texts = await Promise.all(tds.map((td) => td.innerText().then((t) => (t || '').trim())));
      const links = [];
      for (const a of await tr.$$('a[href]')) {
        const h = await a.getAttribute('href');
        if (h && h.startsWith('http')) links.push(h);
      }
      const row = mapDomRow(texts, links);
      if (Object.values(row).some(Boolean)) domRows.push(row);
    }
    if (domRows.length) break;
  }

  await browser.close();
  return domRows;
}

function saveExcel(rows) {
  ensureUploadsDir();
  const wb = XLSX.utils.book_new();
  const data = [HEADERS, ...rows.map((r) => HEADERS.map((h) => r[h] || ''))];
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, '求职信息');
  const outPath = path.join(path.dirname(__dirname), 'uploads', 'jobs.xlsx');
  XLSX.writeFile(wb, outPath);
  return outPath;
}

(async () => {
  console.log('正在打开求职方舟校招页并抓取表格...');
  try {
    const data = await scrape();
    if (!data.length) {
      console.error('未解析到任何表格行，请检查页面结构或是否需登录。');
      process.exit(1);
    }
    const out = saveExcel(data);
    console.log(`已保存 ${data.length} 条记录到 ${out}`);
  } catch (e) {
    console.error('抓取失败:', e.message);
    process.exit(1);
  }
})();
