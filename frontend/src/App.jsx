import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

const API_BASE_URL = '/api'

function App() {
  const [jobs, setJobs] = useState([])
  const [cities, setCities] = useState([])
  const [industries, setIndustries] = useState([])
  const [selectedCity, setSelectedCity] = useState('全部')
  const [selectedIndustry, setSelectedIndustry] = useState('全部')
  const [internshipOnly, setInternshipOnly] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)

  // 获取城市和行业列表
  useEffect(() => {
    fetchCities()
    fetchIndustries()
  }, [])

  // 获取职位数据
  useEffect(() => {
    fetchJobs()
  }, [selectedCity, selectedIndustry, internshipOnly, searchKeyword])

  const fetchCities = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/cities`)
      if (response.data.success) {
        setCities(response.data.data)
      }
    } catch (error) {
      console.error('获取城市列表失败:', error)
    }
  }

  const fetchIndustries = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/industries`)
      if (response.data.success) {
        setIndustries(response.data.data)
      }
    } catch (error) {
      console.error('获取行业列表失败:', error)
    }
  }

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_BASE_URL}/jobs`, {
        params: {
          city: selectedCity,
          industry: selectedIndustry,
          internship: internshipOnly,
          keyword: searchKeyword
        }
      })
      if (response.data.success) {
        setJobs(response.data.data)
      } else {
        console.error('获取职位数据失败:', response.data.message)
        setJobs([])
      }
    } catch (error) {
      console.error('获取职位数据失败:', error)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadFile(file)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      if (response.data.success) {
        alert('文件上传成功！')
        fetchJobs()
        fetchCities()
      } else {
        alert('文件上传失败：' + response.data.message)
      }
    } catch (error) {
      alert('文件上传失败：' + (error.response?.data?.message || error.message))
    }
  }

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
    const tags = []
    if (job.标签) {
      const parts = String(job.标签)
        .split(/[,，、\s]/)
        .map(t => t.trim())
        .filter(Boolean)
      tags.push(...parts)
    }
    // 若标签为空，可补充一些基础信息
    if (tags.length === 0 && job.行业) {
      tags.push(job.行业)
    }
    if (job.地点) {
      tags.push(job.地点)
    }
    return Array.from(new Set(tags))
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>求职信息网站</h1>
        <div className="upload-section">
          <label htmlFor="file-upload" className="upload-button">
            上传Excel文件
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          {uploadFile && <span className="file-name">{uploadFile.name}</span>}
        </div>
      </header>

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
            placeholder="搜索公司 / 职位 / 行业 / 标签..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : jobs.length === 0 ? (
          <div className="empty-message">
            暂无数据，请先上传Excel文件
          </div>
        ) : (
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
                          {job.地点 && (
                            <span className="job-location">{job.地点}</span>
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
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
