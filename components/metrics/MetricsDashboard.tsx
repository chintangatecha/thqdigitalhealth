'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Metric, MetricSection, MetricTrend, UserRole } from '@/lib/types'
import TrendArrow from '@/components/ui/TrendArrow'

interface MetricsDashboardProps {
  role: UserRole
}

const SECTIONS: MetricSection[] = ['SEO', 'PAID', 'CHANNEL HEALTH', 'LOCAL GEO', 'AI / GEO']

function computeTrend(last: string, current: string): MetricTrend {
  const parseNum = (v: string) => parseFloat(v.replace(/[^0-9.-]/g, ''))
  const a = parseNum(last)
  const b = parseNum(current)
  if (isNaN(a) || isNaN(b)) return 'flat'
  if (b > a) return 'up'
  if (b < a) return 'down'
  return 'flat'
}

export default function MetricsDashboard({ role }: MetricsDashboardProps) {
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    const { data } = await supabase.from('metrics').select('*').order('sort_order')
    setMetrics(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchMetrics() }, [fetchMetrics])

  async function handleValueChange(id: string, field: 'last_month_value' | 'this_month_value', value: string) {
    setSaving(id)
    const metric = metrics.find(m => m.id === id)
    if (!metric) return

    const updatedMetric = { ...metric, [field]: value }
    const trend = computeTrend(
      field === 'last_month_value' ? value : updatedMetric.last_month_value,
      field === 'this_month_value' ? value : updatedMetric.this_month_value
    )

    await supabase.from('metrics').update({ [field]: value, trend, updated_at: new Date().toISOString() }).eq('id', id)
    setMetrics(prev => prev.map(m => m.id === id ? { ...m, [field]: value, trend } : m))
    setSaving(null)
  }

  if (loading) {
    return (
      <>
        <div className="quadrant-header">
          <span className="quadrant-title">Metrics Dashboard</span>
        </div>
        <div className="quadrant-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="spinner" style={{ width: '24px', height: '24px' }} />
        </div>
      </>
    )
  }

  return (
    <>
      <div className="quadrant-header">
        <span className="quadrant-title">Metrics Dashboard</span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {role === 'agency' ? 'Click values to edit' : 'Feb 2026'}
        </span>
      </div>

      <div className="quadrant-body" style={{ padding: '0' }}>
        <table className="metrics-table">
          <thead>
            <tr>
              <th style={{ width: '30%' }}>Metric</th>
              <th style={{ width: '12%' }}>Target</th>
              <th style={{ width: '16%' }}>Last Month</th>
              <th style={{ width: '16%' }}>This Month</th>
              <th style={{ width: '8%' }}>Trend</th>
            </tr>
          </thead>
          <tbody>
            {SECTIONS.map(section => {
              const sectionMetrics = metrics.filter(m => m.section === section)
              if (sectionMetrics.length === 0) return null
              return (
                <>
                  <tr key={`section-${section}`} className="section-header-row">
                    <td colSpan={5}>{section}</td>
                  </tr>
                  {sectionMetrics.map(metric => (
                    <MetricRow
                      key={metric.id}
                      metric={metric}
                      editable={true}
                      saving={saving === metric.id}
                      onChange={handleValueChange}
                    />
                  ))}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

interface MetricRowProps {
  metric: Metric
  editable: boolean
  saving: boolean
  onChange: (id: string, field: 'last_month_value' | 'this_month_value', value: string) => void
}

function MetricRow({ metric, saving, onChange }: MetricRowProps) {
  const [editingLast, setEditingLast] = useState(false)
  const [editingThis, setEditingThis] = useState(false)
  const [lastVal, setLastVal] = useState(metric.last_month_value)
  const [thisVal, setThisVal] = useState(metric.this_month_value)

  function commitLast() {
    setEditingLast(false)
    if (lastVal !== metric.last_month_value) {
      onChange(metric.id, 'last_month_value', lastVal)
    }
  }

  function commitThis() {
    setEditingThis(false)
    if (thisVal !== metric.this_month_value) {
      onChange(metric.id, 'this_month_value', thisVal)
    }
  }

  return (
    <tr>
      <td>
        <div style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '13px' }}>
          {metric.metric_name}
          {saving && <span style={{ marginLeft: '6px', color: 'var(--accent)', fontSize: '11px' }}>●</span>}
        </div>
        {metric.what_it_tells_you && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.3' }}>
            {metric.what_it_tells_you}
          </div>
        )}
      </td>
      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{metric.target}</td>
      <td>
        {editingLast ? (
          <input
            type="text"
            value={lastVal}
            onChange={e => setLastVal(e.target.value)}
            onBlur={commitLast}
            onKeyDown={e => e.key === 'Enter' && commitLast()}
            autoFocus
            style={{ padding: '4px 6px', fontSize: '12px' }}
          />
        ) : (
          <span
            onClick={() => setEditingLast(true)}
            style={{ cursor: 'pointer', padding: '4px 6px', borderRadius: '4px', fontSize: '13px', display: 'inline-block' }}
            title="Click to edit"
          >
            {lastVal || <span style={{ color: 'var(--text-muted)' }}>—</span>}
          </span>
        )}
      </td>
      <td>
        {editingThis ? (
          <input
            type="text"
            value={thisVal}
            onChange={e => setThisVal(e.target.value)}
            onBlur={commitThis}
            onKeyDown={e => e.key === 'Enter' && commitThis()}
            autoFocus
            style={{ padding: '4px 6px', fontSize: '12px' }}
          />
        ) : (
          <span
            onClick={() => setEditingThis(true)}
            style={{ cursor: 'pointer', padding: '4px 6px', borderRadius: '4px', fontSize: '13px', display: 'inline-block' }}
            title="Click to edit"
          >
            {thisVal || <span style={{ color: 'var(--text-muted)' }}>—</span>}
          </span>
        )}
      </td>
      <td style={{ textAlign: 'center' }}>
        <TrendArrow trend={metric.trend} />
      </td>
    </tr>
  )
}
