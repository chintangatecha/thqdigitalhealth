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
  const [rightTab, setRightTab] = useState<'analytics' | 'website'>('analytics')

  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY)
    if (saved === 'admin' || saved === 'agency') setRole(saved)
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
  if (!role) return <LoginScreen onLogin={handleLogin} />

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', overflow: 'hidden' }}>

      {/* Navbar */}
      <header style={{
        height: '52px', flexShrink: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 20px',
        borderBottom: '1px solid var(--border)', background: 'var(--bg-card)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px', height: '32px', background: 'var(--accent)', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', fontWeight: '800', color: 'white', letterSpacing: '-0.3px',
          }}>THQ</div>
          <div>
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>Digital Health</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>Trading Headquarters</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: '600',
            textTransform: 'uppercase', letterSpacing: '0.05em',
            background: role === 'admin' ? 'rgba(249,115,22,0.15)' : 'rgba(59,130,246,0.15)',
            color: role === 'admin' ? 'var(--accent)' : '#60a5fa',
          }}>{role}</span>
          <button className="btn-ghost btn-sm" onClick={handleLogout}>Sign Out</button>
        </div>
      </header>

      {/* Main layout */}
      <main style={{
        flex: 1, overflow: 'hidden', padding: '12px', display: 'grid', gap: '12px',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr',
      }}>

        {/* LEFT — Task Manager full height */}
        <div className="quadrant">
          <TaskManager role={role} />
        </div>

        {/* RIGHT — stacked: Metrics on top, tabbed panel on bottom */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>

          {/* Metrics */}
          <div className="quadrant" style={{ flex: '1 1 0', minHeight: 0 }}>
            <MetricsDashboard role={role} />
          </div>

          {/* Tabbed bottom panel — admin only */}
          {role === 'admin' ? (
            <div className="quadrant" style={{ flex: '1 1 0', minHeight: 0 }}>
              {/* Tab bar */}
              <div className="quadrant-header" style={{ gap: '0' }}>
                {(['analytics', 'website'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setRightTab(tab)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '0 16px', height: '100%',
                      fontSize: '13px', fontWeight: '600',
                      color: rightTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                      borderBottom: rightTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                      transition: 'color 0.15s',
                    }}
                  >
                    {tab === 'analytics' ? 'Analytics' : 'Website Performance'}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                {rightTab === 'analytics'
                  ? <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}><AnalyticsSummary embedded /></div>
                  : <WebsitePerformance />
                }
              </div>
            </div>
          ) : (
            <div className="quadrant" style={{ flex: '1 1 0', minHeight: 0 }}>
              <div className="quadrant-header"><span className="quadrant-title">Summary</span></div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Admin access only</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
