'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Metric } from '@/lib/types'
import TrendArrow from '@/components/ui/TrendArrow'

export default function AnalyticsSummary() {
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMetrics = useCallback(async () => {
    const { data } = await supabase.from('metrics').select('*').order('sort_order')
    setMetrics(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchMetrics() }, [fetchMetrics])

  if (loading) {
    return (
      <>
        <div className="quadrant-header">
          <span className="quadrant-title">Analytics Summary</span>
        </div>
        <div className="quadrant-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="spinner" style={{ width: '24px', height: '24px' }} />
        </div>
      </>
    )
  }

  const total = metrics.length
  const upCount = metrics.filter(m => m.trend === 'up').length
  const downCount = metrics.filter(m => m.trend === 'down').length
  const healthScore = total > 0 ? Math.round((upCount / total) * 100) : 0

  // Channel breakdown: group by section
  const seoMetrics = metrics.filter(m => m.section === 'SEO')
  const paidMetrics = metrics.filter(m => m.section === 'PAID')
  const localMetrics = metrics.filter(m => ['LOCAL GEO', 'CHANNEL HEALTH'].includes(m.section))

  const seoScore = seoMetrics.length > 0 ? Math.round((seoMetrics.filter(m => m.trend === 'up').length / seoMetrics.length) * 100) : 0
  const paidScore = paidMetrics.length > 0 ? Math.round((paidMetrics.filter(m => m.trend === 'up').length / paidMetrics.length) * 100) : 0
  const localScore = localMetrics.length > 0 ? Math.round((localMetrics.filter(m => m.trend === 'up').length / localMetrics.length) * 100) : 0
  const aiMetrics = metrics.filter(m => m.section === 'AI / GEO')
  const aiScore = aiMetrics.length > 0 ? Math.round((aiMetrics.filter(m => m.trend === 'up').length / aiMetrics.length) * 100) : 0

  // Worst performing metrics (trending down)
  const worstMetrics = metrics.filter(m => m.trend === 'down').slice(0, 3)
  // If not enough down, use flat
  const priorityMetrics = worstMetrics.length < 3
    ? [...worstMetrics, ...metrics.filter(m => m.trend === 'flat').slice(0, 3 - worstMetrics.length)]
    : worstMetrics

  function getPriorityAction(metric: Metric): string {
    const actions: Record<string, string> = {
      'Keywords Page 1 VIC': 'Optimise VIC product pages with target keyword clusters',
      'Keywords Page 1 QLD': 'Optimise QLD product pages for Brisbane/Toowoomba keywords',
      'Organic Sessions': 'Publish targeted blog content and improve internal linking',
      'Organic Revenue + Enquiries': 'Add CTAs and phone number to high-traffic organic pages',
      'Google Ads Cost Per Enquiry': 'Review ad copy and landing page relevance to reduce CPE',
      'Google Ads ROAS': 'Pause low-performing campaigns and increase budget on winners',
      'Meta Ads Cost Per Enquiry': 'Test new creative formats and refine audience targeting',
      'Meta Ads ROAS': 'Improve product imagery and retargeting campaign structure',
      'Organic % of Total Revenue': 'Reduce paid dependency by scaling organic content output',
      'Call Tracked Enquiries by Channel': 'Review call tracking setup and ensure all channels are tagged',
      'GBP Calls + Direction Requests': 'Complete all Google Business Profile sections and post weekly',
      'GBP Reviews Count and Rating': 'Launch customer review request campaign post-purchase',
      'AI Mentions (ChatGPT/Gemini/Perplexity)': 'Create authoritative long-form content targeting LLM training topics',
      'AI Cited Pages': 'Improve E-E-A-T signals and add structured data markup',
      'AI Visibility Score': 'Build brand mentions across high-authority third-party sites',
    }
    return actions[metric.metric_name] || `Improve ${metric.metric_name} performance`
  }

  const getHealthColour = (score: number) => {
    if (score >= 75) return 'var(--success)'
    if (score >= 50) return 'var(--warning)'
    return 'var(--danger)'
  }

  return (
    <>
      <div className="quadrant-header">
        <span className="quadrant-title">Analytics Summary</span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Admin only</span>
      </div>

      <div className="quadrant-body">
        {/* Overall health score */}
        <div style={{ marginBottom: '16px' }}>
          <div className="stat-card" style={{ textAlign: 'center', padding: '24px' }}>
            <div style={{ fontSize: '52px', fontWeight: '800', color: getHealthColour(healthScore), lineHeight: '1' }}>
              {healthScore}%
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>Overall Digital Health Score</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {upCount} of {total} metrics trending up
            </div>
          </div>
        </div>

        {/* Channel breakdown */}
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>
            Channel Performance
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { label: 'Organic SEO', score: seoScore, icon: '🔍' },
              { label: 'Paid Ads', score: paidScore, icon: '💰' },
              { label: 'Local / GBP', score: localScore, icon: '📍' },
              { label: 'AI / GEO', score: aiScore, icon: '🤖' },
            ].map(ch => (
              <div key={ch.label} className="stat-card" style={{ padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ch.icon} {ch.label}</span>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: getHealthColour(ch.score) }}>{ch.score}%</span>
                </div>
                <div style={{ marginTop: '6px', height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${ch.score}%`, background: getHealthColour(ch.score), borderRadius: '2px', transition: 'width 0.5s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Month-on-month summary */}
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>
            Month-on-Month Trend
          </h3>
          <div className="card" style={{ margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--success)' }}>{upCount}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Improving ↑</div>
              </div>
              <div style={{ width: '1px', background: 'var(--border)' }} />
              <div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-muted)' }}>{metrics.filter(m => m.trend === 'flat').length}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Flat →</div>
              </div>
              <div style={{ width: '1px', background: 'var(--border)' }} />
              <div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--danger)' }}>{downCount}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Declining ↓</div>
              </div>
            </div>
          </div>
        </div>

        {/* Top 3 priority actions */}
        {priorityMetrics.length > 0 && (
          <div>
            <h3 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>
              Top Priority Actions
            </h3>
            {priorityMetrics.map((metric, i) => (
              <div key={metric.id} style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
                padding: '10px',
                background: '#1a1a1a',
                borderRadius: '8px',
                marginBottom: '6px',
                borderLeft: `3px solid ${i === 0 ? 'var(--danger)' : i === 1 ? 'var(--warning)' : 'var(--text-muted)'}`,
              }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', flexShrink: 0 }}>#{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>{metric.metric_name}</span>
                    <TrendArrow trend={metric.trend} />
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {getPriorityAction(metric)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {priorityMetrics.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--success)' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎉</div>
            <p style={{ margin: 0, fontSize: '13px' }}>All metrics are trending positively!</p>
          </div>
        )}
      </div>
    </>
  )
}
