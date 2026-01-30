import React, { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import './App.css'

// 使用 Vite 的 base URL，自动适配子路径部署
// 如果 base: '/job-info/'，则 API_BASE_URL 会是 '/job-info/api'
// 如果 base: '/'，则 API_BASE_URL 会是 '/api'
const API_BASE_URL = `${import.meta.env.BASE_URL}api`.replace(/\/+/g, '/')

function App() {
  const [allJobs, setAllJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedCity, setSelectedCity] = useState('全部')
  const [selectedIndustry, setSelectedIndustry] = useState('全部')
  const [internshipOnly, setInternshipOnly] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')

  // 仅拉取一次全量岗位，不做筛选请求
  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true)
      try {
        const res = await axios.get(`${API_BASE_URL}/jobs`)
        if (res.data.success) {
          setAllJobs(res.data.data || [])
        } else {
          setAllJobs([])
        }
      } catch (e) {
        console.error('获取职位数据失败:', e)
        setAllJobs([])
      } finally {
        setLoading(false)
      }
    }
    fetchJobs()
  }, [])

  // 行业列表：仅来自 Excel「行业」列，不使用 API
  const industries = useMemo(() => {
    const set = new Set()
    allJobs.forEach((job) => {
      const raw = job.行业
      if (!raw) return
      String(raw)
        .split(/[,，/、]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((name) => set.add(name))
    })
    return Array.from(set).sort()
  }, [allJobs])

  // 城市列表：从岗位数据中的地点解析
  const cities = useMemo(() => {
    const set = new Set()
    allJobs.forEach((job) => {
      if (!job.地点) return
      job.地点
        .split(/[,，]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((loc) => set.add(loc))
    })
    return Array.from(set).sort()
  }, [allJobs])

  // 前端筛选：城市、行业、只看实习（标签含「实习」）、关键词
  const jobs = useMemo(() => {
    let list = [...allJobs]
    if (selectedCity && selectedCity !== '全部') {
      list = list.filter((j) => j.地点 && j.地点.includes(selectedCity))
    }
    if (selectedIndustry && selectedIndustry !== '全部') {
      list = list.filter((j) => j.行业 && j.行业.includes(selectedIndustry))
    }
    if (internshipOnly) {
      list = list.filter((j) => (j.标签 || '').includes('实习'))
    }
    const kw = searchKeyword.trim()
    if (kw) {
      const fields = [j => j.公司, j => j.职位, j => j.行业, j => j.标签, j => j.批次, j => j.地点, j => j.薪资, j => j.福利待遇]
      list = list.filter((j) => fields.some((f) => (f(j) || '').includes(kw)))
    }
    return list
  }, [allJobs, selectedCity, selectedIndustry, internshipOnly, searchKeyword])

  const getOfferType = (job) => {
    const text = `${job.批次 || ''} ${job.标签 || ''}`
    if (!text) return ''
    if (text.includes('秋招')) return '秋招'
    if (text.includes('春招')) return '春招'
    if (text.includes('寒假实习')) return '寒假实习'
    if (text.includes('暑期实习')) return '暑期实习'
    if (text.includes('常规实习')) return '常规实习'
    if (text.includes('实习')) return '实习'
    return ''
  }

  const getTags = (job) => {
    if (!job.标签) return []
    const parts = String(job.标签)
      .split(/[,，、\s]/)
      .map(t => t.trim())
      .filter(Boolean)
    return Array.from(new Set(parts))
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>2026网申职位表</h1>
        <p className="app-header-sub">发现校招与实习机会</p>
      </header>

      <div className="filters-section">
        <p className="filters-section-title">筛选</p>
        <div className="filters">
        <div className="filter-row">
          <div className="filter-group">
            <label>城市：</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="filter-select"
            >
              <option value="全部">全部</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>行业：</label>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="filter-select"
            >
              <option value="全部">全部</option>
              {industries.map(ind => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>

          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={internshipOnly}
              onChange={(e) => setInternshipOnly(e.target.checked)}
            />
            <span>只看实习</span>
          </label>
        </div>

        <div className="filter-search">
          <input
            type="text"
            className="search-input"
            placeholder="搜索公司 / 职位 / 行业 / 标签 / 薪资 / 福利..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : jobs.length === 0 ? (
          <div className="empty-message">
            暂无岗位数据
          </div>
        ) : (
          <div className="jobs-section">
            <p className="jobs-section-title">岗位</p>
            <div className="jobs-list">
            {jobs.map((job, index) => {
              const offerType = getOfferType(job)
              const tags = getTags(job)
              const firstLetter = (job.公司 || '企').charAt(0).toUpperCase()

              return (
                <div className="job-card" key={index}>
                  <div className="job-card-main">
                    <div className="job-card-logo">
                      <div className="logo-circle">
                        {firstLetter}
                      </div>
                    </div>
                    <div className="job-card-content">
                      <div className="job-card-header">
                        <div className="job-title-row">
                          <span className="job-title">{job.职位 || '-'}</span>
                          {offerType && (
                            <span className="job-offer-type">{offerType}</span>
                          )}
                        </div>
                        <div className="job-company-row">
                          <span className="job-company">{job.公司 || '-'}</span>
                          {job.行业 && (
                            <span className="job-industry"> · {job.行业}</span>
                          )}
                          {job.地点 && (
                            <span className="job-location"> · {job.地点}</span>
                          )}
                        </div>
                      </div>

                      {tags.length > 0 && (
                        <div className="job-tags">
                          {tags.map(tag => (
                            <span className="job-tag" key={tag}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="job-footer">
                        <span className="job-deadline">
                          截止时间：{job.投递截止 || '未注明'}
                        </span>
                      </div>
                    </div>

                    <div className="job-card-right">
                      {job.薪资 && (
                        <div className="job-salary">
                          <span className="job-salary-label">薪资</span>
                          <span className="job-salary-value">{job.薪资}</span>
                        </div>
                      )}
                      {job.福利待遇 && (
                        <div className="job-benefits">
                          <span className="job-benefits-label">福利待遇</span>
                          <span className="job-benefits-value">{job.福利待遇}</span>
                        </div>
                      )}
                      {job.操作 && (
                        <a
                          href={job.操作}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="job-apply-btn"
                        >
                          {job.操作.startsWith('http') ? '查看详情' : job.操作}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
