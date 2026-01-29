"""
创建示例Excel文件的脚本
运行此脚本将生成一个包含示例数据的Excel文件
"""
import openpyxl
from datetime import datetime

# 创建工作簿
wb = openpyxl.Workbook()
ws = wb.active
ws.title = "求职信息"

# 设置表头
headers = ['更新日期', '公司', '行业', '标签', '批次', '职位', '地点', '投递截止', '操作']
ws.append(headers)

# 示例数据
sample_data = [
    ['2024-01-15', '腾讯', '互联网', '大厂,秋招', '2024秋招', '前端开发工程师', '深圳,北京', '2024-02-15', 'https://careers.tencent.com'],
    ['2024-01-16', '阿里巴巴', '互联网', '大厂,网申', '2024春招', 'Java开发工程师', '杭州,上海', '2024-02-20', 'https://campus.alibaba.com'],
    ['2024-01-17', '华为', '通信', '大厂,国企', '2024秋招', '软件工程师', '深圳,西安', '2024-02-25', 'https://career.huawei.com'],
    ['2024-01-18', '中国移动', '通信', '国企,秋招', '2024秋招', '网络工程师', '北京,上海', '2024-03-01', 'https://job.10086.cn'],
    ['2024-01-19', '字节跳动', '互联网', '大厂,网申', '最新网申', '产品经理', '北京,上海,深圳', '2024-02-18', 'https://job.bytedance.com'],
    ['2024-01-20', '百度', '互联网', '大厂,实习', '实习汇总', '算法实习生', '北京', '2024-02-28', 'https://talent.baidu.com'],
    ['2024-01-21', '京东', '电商', '大厂,秋招', '热门秋招', '后端开发工程师', '北京,成都', '2024-03-05', 'https://zhaopin.jd.com'],
    ['2024-01-22', '美团', '互联网', '大厂,网申', '最新网申', '数据分析师', '北京,上海', '2024-02-22', 'https://zhaopin.meituan.com'],
    ['2024-01-23', '滴滴', '互联网', '大厂,实习', '实习汇总', '前端实习生', '北京', '2024-03-10', 'https://job.didiglobal.com'],
    ['2024-01-24', '中国银行', '金融', '国企,秋招', '国企汇总', '软件开发', '北京,上海,深圳', '2024-03-15', 'https://www.boc.cn'],
]

# 添加数据
for row in sample_data:
    ws.append(row)

# 调整列宽
column_widths = {
    'A': 12,  # 更新日期
    'B': 15,  # 公司
    'C': 12,  # 行业
    'D': 15,  # 标签
    'E': 12,  # 批次
    'F': 20,  # 职位
    'G': 15,  # 地点
    'H': 12,  # 投递截止
    'I': 30,  # 操作
}

for col, width in column_widths.items():
    ws.column_dimensions[col].width = width

# 保存文件
filename = 'backend/uploads/jobs.xlsx'
import os
os.makedirs('backend/uploads', exist_ok=True)
wb.save(filename)
print(f'示例Excel文件已创建: {filename}')
print('包含10条示例数据')
