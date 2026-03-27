'use client'

import { useState, useEffect } from 'react'
import { UserRole } from '@/lib/types'
import LoginScreen from '@/components/auth/LoginScreen'
import TaskManager from '@/components/tasks/TaskManager'
import MetricsDashboard from '@/components/metrics/MetricsDashboard'
import WebsitePerformance from '@/components/performance/WebsitePerformance'
import AnalyticsSummary from '@/components/analytics/AnalyticsSummary'

const SESSION_KEY = 'thq_session'

export default function Dashboard() {
  const [role, setRole] = useState<UserRole | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY)
    if (saved === 'admin' || saved === 'agency') {
      setRole(saved)
    }
    setMounted(true)
  }, [])

  function handleLogin(r: UserRole) {
    localStorage.setItem(SESSION_KEY, r)
    setRole(r)
  }

  function handleLogout() {
    localStorage.removeItem(SESSION_KEY)
    setRole(null)
  }

  if (!mounted) return null

  if (!role) {
    return <LoginScreen onLogin={handleLogin} />
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-primary)',
      overflow: 'hidden',
    }}>
      {/* Top navbar */}
      <header style={{
        height: '52px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: 'var(--accent)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: '800',
            color: 'white',
            letterSpacing: '-0.3px',
          }}>
            THQ
          </div>
          <div>
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Digital Health
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>
              Trading Headquarters
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            fontSize: '11px',
            padding: '3px 10px',
            borderRadius: '20px',
            background: role === 'admin' ? 'rgba(249,115,22,0.15)' : 'rgba(59,130,246,0.15)',
            color: role === 'admin' ? 'var(--accent)' : '#60a5fa',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {role}
          </span>
          <button className="btn-ghost btn-sm" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Four quadrant grid */}
      <main style={{
        flex: 1,
        overflow: 'hidden',
        padding: '12px',
        display: 'grid',
        gap: '12px',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
      }}>
        {/* Top Left — Task Manager */}
        <div className="quadrant">
          <TaskManager role={role} />
        </div>

        {/* Top Right — Metrics Dashboard */}
        <div className="quadrant">
          <MetricsDashboard role={role} />
        </div>

        {/* Bottom Left — Website Performance (admin only) */}
        <div className="quadrant">
          {role === 'admin' ? (
            <WebsitePerformance />
          ) : (
            <AgencyPlaceholder title="THQ Website Performance" message="Available to admins only" />
          )}
        </div>

        {/* Bottom Right — Analytics Summary (admin only) */}
        <div className="quadrant">
          {role === 'admin' ? (
            <AnalyticsSummary />
          ) : (
            <AgencyPlaceholder title="Analytics Summary" message="Available to admins only" />
          )}
        </div>
      </main>
    </div>
  )
}

function AgencyPlaceholder({ title, message }: { title: string; message: string }) {
  return (
    <>
      <div className="quadrant-header">
        <span className="quadrant-title">{title}</span>
      </div>
      <div className="quadrant-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
        <span style={{ fontSize: '32px' }}>🔒</span>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>{message}</p>
      </div>
    </>
  )
}
