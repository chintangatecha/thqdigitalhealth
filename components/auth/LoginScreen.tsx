'use client'

import { useState } from 'react'
import { ADMIN_PASSWORD, AGENCY_PASSWORD } from '@/lib/constants'
import { UserRole } from '@/lib/types'

interface LoginScreenProps {
  onLogin: (role: UserRole) => void
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      onLogin('admin')
    } else if (password === AGENCY_PASSWORD) {
      onLogin('agency')
    } else {
      setError('Incorrect password. Please try again.')
      setPassword('')
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            background: 'var(--accent)',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '22px',
            fontWeight: '800',
            color: 'white',
            letterSpacing: '-0.5px'
          }}>
            THQ
          </div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)' }}>
            Digital Health
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
            Trading Headquarters
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label>Access Password</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="Enter password..."
              autoFocus
            />
          </div>

          {error && (
            <p style={{ color: 'var(--danger)', fontSize: '13px', margin: '0 0 12px' }}>
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px' }}>
            Sign In
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
          Contact your THQ administrator for access
        </p>
      </div>
    </div>
  )
}
