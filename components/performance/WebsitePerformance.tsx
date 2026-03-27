'use client'

import { useState } from 'react'
import { WebsiteAnalysis } from '@/lib/types'

export default function WebsitePerformance() {
  const [url, setUrl] = useState('https://thq.com.au')
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<WebsiteAnalysis | null>(null)
  const [error, setError] = useState('')

  async function handleAnalyse() {
    setLoading(true)
    setError('')
    setAnalysis(null)
    try {
      const res = await fetch('/api/analyse-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      if (!res.ok) throw new Error('Analysis failed')
      const data = await res.json()
      setAnalysis(data)
    } catch {
      setError('Failed to analyse website. Please try again.')
    }
    setLoading(false)
  }

  return (
    <>
      <div className="quadrant-header">
        <span className="quadrant-title">THQ Website Performance</span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Admin only</span>
      </div>

      <div className="quadrant-body">
        {/* URL input row */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            className="btn-primary"
            onClick={handleAnalyse}
            disabled={loading || !url}
            style={{ flexShrink: 0 }}
          >
            {loading ? (
              <><span className="spinner" style={{ width: '12px', height: '12px', marginRight: '6px' }} />Analysing...</>
            ) : 'Analyse Website'}
          </button>
        </div>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', marginBottom: '16px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--danger)' }}>{error}</p>
          </div>
        )}

        {!analysis && !loading && !error && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
            <p style={{ margin: 0, fontSize: '13px' }}>
              Enter a URL and click Analyse Website to get SEO insights powered by Claude AI.
            </p>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div className="spinner" style={{ width: '28px', height: '28px', margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              Analysing {url} against THQ SEO rulebook...
            </p>
          </div>
        )}

        {analysis && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="result-card">
              <h4>🏥 SEO Health Summary</h4>
              <p>{analysis.seoHealth}</p>
            </div>
            <div className="result-card">
              <h4>📈 Top Performing Pages</h4>
              <p>{analysis.topPages}</p>
            </div>
            <div className="result-card">
              <h4>🕳️ Content Gaps</h4>
              <p>{analysis.contentGaps}</p>
            </div>
            <div className="result-card" style={{ borderLeftColor: 'var(--success)' }}>
              <h4 style={{ color: 'var(--success)' }}>⚡ Quick Wins</h4>
              <p>{analysis.quickWins}</p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
