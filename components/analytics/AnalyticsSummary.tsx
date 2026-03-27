'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Metric, Task } from '@/lib/types'

export default function AnalyticsSummary({ embedded }: { embedded?: boolean }) {
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const [{ data: metricsData }, { data: tasksData }] = await Promise.all([
      supabase.from('metrics').select('*').order('sort_order'),
      supabase.from('tasks').select('*'),
    ])
    setMetrics(metricsData || [])
    setTasks(tasksData || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    if (embedded) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}><span className="spinner" style={{ width: '24px', height: '24px' }} /></div>
    return (
      <>
        <div className="quadrant-header"><span className="quadrant-title">Analytics Summary</span></div>
        <div className="quadrant-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="spinner" style={{ width: '24px', height: '24px' }} />
        </div>
      </>
    )
  }

  // Metrics with actual values filled in
  const filledMetrics = metrics.filter(m => m.this_month_value && m.this_month_value.trim() !== '')
  const totalMetrics = metrics.length
  const coverage = totalMetrics > 0 ? Math.round((filledMetrics.length / totalMetrics) * 100) : 0

  // Trend breakdown
  const upCount = metrics.filter(m => m.trend === 'up').length
  const downCount = metrics.filter(m => m.trend === 'down').length
  const flatCount = metrics.filter(m => m.trend === 'flat').length

  // Task stats
  const totalTasks = tasks.length
  const approvedTasks = tasks.filter(t => t.approved).length
  const verifiedTasks = tasks.filter(t => t.status === 'Verified').length
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length
  const pendingTasks = tasks.filter(t => t.status === 'Pending').length

  // Per-section metric health
  const sections = [
    { key: 'SEO', label: 'SEO', icon: '🔍', color: '#3b82f6' },
    { key: 'PAID', label: 'Paid Ads', icon: '💰', color: '#f59e0b' },
    { key: 'LOCAL GEO', label: 'Local', icon: '📍', color: '#f97316' },
    { key: 'AI / GEO', label: 'AI / GEO', icon: '🤖', color: '#a855f7' },
    { key: 'CHANNEL HEALTH', label: 'Channels', icon: '📊', color: '#22c55e' },
  ] as const

  // Metrics below target (where both values present)
  const belowTarget = metrics.filter(m => {
    if (!m.this_month_value || !m.target) return false
    const current = parseFloat(m.this_month_value.replace(/[^0-9.]/g, ''))
    const target = parseFloat(m.target.replace(/[^0-9.]/g, ''))
    return !isNaN(current) && !isNaN(target) && current < target
  })

  // Task category breakdown
  const tasksByCategory = ['SEO', 'Google Ads', 'Meta', 'GEO', 'Local'].map(cat => ({
    cat,
    count: tasks.filter(t => t.category === cat).length,
  })).filter(c => c.count > 0).sort((a, b) => b.count - a.count)

  const content = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Data coverage bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Data Coverage</span>
            <span style={{ fontSize: '12px', color: coverage === 100 ? 'var(--success)' : coverage > 50 ? 'var(--warning)' : 'var(--danger)', fontWeight: '700' }}>
              {filledMetrics.length} / {totalMetrics} metrics filled
            </span>
          </div>
          <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${coverage}%`,
              background: coverage === 100 ? 'var(--success)' : coverage > 50 ? 'var(--warning)' : 'var(--danger)',
              borderRadius: '3px',
              transition: 'width 0.6s ease',
            }} />
          </div>
          {coverage < 100 && (
            <p style={{ margin: '5px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
              {totalMetrics - filledMetrics.length} metric{totalMetrics - filledMetrics.length !== 1 ? 's' : ''} need values — ask agency to update
            </p>
          )}
        </div>

        {/* Trend snapshot */}
        {filledMetrics.length > 0 && (
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Trend Snapshot</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '8px' }}>
              {[
                { label: 'Improving', count: upCount, color: 'var(--success)', icon: '↑' },
                { label: 'Flat', count: flatCount, color: 'var(--text-muted)', icon: '→' },
                { label: 'Declining', count: downCount, color: 'var(--danger)', icon: '↓' },
              ].map(t => (
                <div key={t.label} style={{ background: '#1a1a1a', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: t.color }}>{t.count}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{t.icon} {t.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section health dots */}
        <div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>By Channel</span>
          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {sections.map(sec => {
              const secMetrics = metrics.filter(m => m.section === sec.key)
              const filled = secMetrics.filter(m => m.this_month_value?.trim())
              const up = secMetrics.filter(m => m.trend === 'up').length
              const down = secMetrics.filter(m => m.trend === 'down').length
              return (
                <div key={sec.key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '13px', width: '16px', textAlign: 'center' }}>{sec.icon}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', width: '80px', flexShrink: 0 }}>{sec.label}</span>
                  <div style={{ flex: 1, display: 'flex', gap: '3px' }}>
                    {secMetrics.map((m, i) => (
                      <div key={i} style={{
                        flex: 1,
                        height: '8px',
                        borderRadius: '2px',
                        background: !m.this_month_value?.trim() ? 'var(--border)' :
                          m.trend === 'up' ? 'var(--success)' :
                          m.trend === 'down' ? 'var(--danger)' : 'var(--text-muted)',
                      }} title={m.metric_name} />
                    ))}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '60px', textAlign: 'right', flexShrink: 0 }}>
                    {filled.length === 0 ? 'No data' : `${up}↑ ${down}↓`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tasks overview */}
        <div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tasks Overview</span>
          {totalTasks === 0 ? (
            <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>No tasks created yet.</p>
          ) : (
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {[
                { label: 'Total tasks', val: totalTasks, color: 'var(--text-secondary)' },
                { label: 'Sent to agency', val: approvedTasks, color: '#60a5fa' },
                { label: 'In progress', val: inProgressTasks, color: 'var(--warning)' },
                { label: 'Pending', val: pendingTasks, color: 'var(--text-muted)' },
                { label: 'Verified complete', val: verifiedTasks, color: 'var(--success)' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.label}</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: row.color }}>{row.val}</span>
                </div>
              ))}
              {tasksByCategory.length > 0 && (
                <div style={{ marginTop: '4px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {tasksByCategory.map(({ cat, count }) => (
                    <span key={cat} style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: 'rgba(255,255,255,0.06)',
                      color: 'var(--text-muted)',
                    }}>{cat} {count}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Below-target alerts */}
        {belowTarget.length > 0 && (
          <div>
            <span style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Below Target</span>
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {belowTarget.slice(0, 4).map(m => (
                <div key={m.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '6px 10px', background: 'rgba(239,68,68,0.06)', borderRadius: '6px',
                  borderLeft: '2px solid var(--danger)',
                }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{m.metric_name}</span>
                  <span style={{ fontSize: '11px', color: 'var(--danger)', flexShrink: 0, marginLeft: '8px' }}>
                    {m.this_month_value} / {m.target}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
  )

  if (embedded) return content

  return (
    <>
      <div className="quadrant-header">
        <span className="quadrant-title">Analytics Summary</span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Admin only</span>
      </div>
      <div className="quadrant-body">{content}</div>
    </>
  )
}
