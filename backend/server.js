const express = require('express');
const cors = require('cors');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, 'jobs.xlsx');
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('只支持Excel文件格式'));
    }
  }
});

// 读取Excel文件的辅助函数
function readExcelFile(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    // 确保数据格式正确
    return data.map(row => ({
      更新日期: row['更新日期'] || '',
      公司: row['公司'] || '',
      行业: row['行业'] || '',
      标签: row['标签'] || '',
      批次: row['批次'] || '',
      职位: row['职位'] || '',
      地点: row['地点'] || '',
      投递截止: row['投递截止'] || '',
      薪资: row['薪资'] || '',
      福利待遇: row['福利待遇'] || '',
      操作: row['操作'] || ''
    }));
  } catch (error) {
    console.error('读取Excel文件错误:', error);
    return [];
  }
}

// 获取所有职位信息
app.get('/api/jobs', (req, res) => {
  const { city, type, industry, internship, keyword } = req.query;
  const filePath = path.join(__dirname, 'uploads', 'jobs.xlsx');
  
  if (!fs.existsSync(filePath)) {
    return res.json({ success: false, message: 'Excel文件不存在，请先上传文件', data: [] });
  }
  
  let jobs = readExcelFile(filePath);
  
  // 根据城市筛选
  if (city && city !== '全部') {
    jobs = jobs.filter(job => job.地点 && job.地点.includes(city));
  }

  // 根据行业筛选
  if (industry && industry !== '全部') {
    jobs = jobs.filter(job => job.行业 && job.行业.includes(industry));
  }
  
  // 根据类型筛选（基于标签或批次）—— 兼容旧的 Offer 类型过滤
  if (type && type !== '全部') {
    const typeMap = {
      '最新网申': '网申',
      '热门秋招': '秋招',
      '国企汇总': '国企',
      '大厂汇总': '大厂',
      '实习汇总': '实习'
    };
    
    const mapped = typeMap[type] || type;
    jobs = jobs.filter(job => 
      (job.标签 && job.标签.includes(mapped)) || 
      (job.批次 && job.批次.includes(mapped))
    );
  }

  // 是否仅看实习岗位：只筛选标签中包含「实习」的卡片
  if (internship === 'true') {
    jobs = jobs.filter(job => (job.标签 || '').includes('实习'));
  }

  // 关键词搜索：公司 / 职位 / 行业 / 标签 / 批次 / 地点 / 薪资 / 福利待遇
  if (keyword && keyword.trim()) {
    const kw = keyword.trim();
    jobs = jobs.filter(job => {
      const fields = [
        job.公司,
        job.职位,
        job.行业,
        job.标签,
        job.批次,
        job.地点,
        job.薪资,
        job.福利待遇
      ];
      return fields.some(v => v && v.includes(kw));
    });
  }
  
  res.json({ success: true, data: jobs });
});

// 上传Excel文件
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: '没有上传文件' });
  }
  
  res.json({ 
    success: true, 
    message: '文件上传成功',
    filename: req.file.filename 
  });
});

// 获取所有城市列表
app.get('/api/cities', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', 'jobs.xlsx');
  
  if (!fs.existsSync(filePath)) {
    return res.json({ success: true, data: [] });
  }
  
  const jobs = readExcelFile(filePath);
  const cities = new Set();
  
  jobs.forEach(job => {
    if (job.地点) {
      // 提取城市名称（假设格式为"城市"或"城市, 城市"）
      const locations = job.地点.split(/[,，]/).map(loc => loc.trim());
      locations.forEach(loc => {
        if (loc) cities.add(loc);
      });
    }
  });
  
  res.json({ success: true, data: Array.from(cities).sort() });
});

// 获取所有行业列表
app.get('/api/industries', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', 'jobs.xlsx');
  
  if (!fs.existsSync(filePath)) {
    return res.json({ success: true, data: [] });
  }

  const jobs = readExcelFile(filePath);
  const industries = new Set();

  jobs.forEach(job => {
    if (job.行业) {
      const raw = String(job.行业);
      // 支持 "互联网/软件"、"互联网, 软件" 等多种分隔
      const parts = raw.split(/[,，/、]/).map(s => s.trim());
      parts.forEach(name => {
        if (name) industries.add(name);
      });
    }
  });

  res.json({ success: true, data: Array.from(industries).sort() });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
