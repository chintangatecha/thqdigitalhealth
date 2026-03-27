'use client'

import { useState } from 'react'
import { Task, TaskStatus, UserRole } from '@/lib/types'
import StatusBadge from '@/components/ui/StatusBadge'

interface TaskCardProps {
  task: Task
  role: UserRole
  onUpdate: (id: string, updates: Partial<Task>) => Promise<void>
  onDelete?: (id: string) => void
  onVerify?: (task: Task) => void
}

export default function TaskCard({ task, role, onUpdate, onDelete, onVerify }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [localTask, setLocalTask] = useState(task)
  const [verifying, setVerifying] = useState(false)

  async function saveField(field: keyof Task, value: string | boolean) {
    setSaving(true)
    setLocalTask(prev => ({ ...prev, [field]: value }))
    await onUpdate(task.id, { [field]: value })
    setSaving(false)
  }

  async function handleVerify() {
    if (!onVerify) return
    setVerifying(true)
    await onVerify(localTask)
    setVerifying(false)
  }

  const statusOptions: TaskStatus[] = ['Pending', 'In Progress', 'Done', 'Verified', 'Failed']

  return (
    <div className="card" style={{ borderLeft: `3px solid ${getCategoryColor(localTask.category)}` }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
            <StatusBadge category={localTask.category} />
            <StatusBadge status={localTask.status} />
            {localTask.ai_verification_result && !localTask.admin_override && (
              <StatusBadge verification={localTask.ai_verification_result} />
            )}
            {localTask.admin_override && (
              <span className="badge" style={{ background: 'rgba(249,115,22,0.2)', color: '#f97316' }}>Admin Override</span>
            )}
          </div>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', lineHeight: '1.3' }}>
            {localTask.title}
          </h3>
        </div>
        <button className="btn-ghost btn-sm" onClick={() => setExpanded(e => !e)} style={{ flexShrink: 0 }}>
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {/* Description preview */}
      <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
        {localTask.description}
      </p>

      {/* Due date row */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
        {localTask.due_date && (
          <span>📅 Due: {new Date(localTask.due_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        )}
        {saving && <span style={{ color: 'var(--accent)' }}>Saving...</span>}
      </div>

      {/* Expanded section */}
      {expanded && (
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="divider" />

          {/* Admin context */}
          {(role === 'admin' || localTask.admin_context) && (
            <div>
              <label>Admin Context / Notes</label>
              {role === 'admin' ? (
                <textarea
                  rows={2}
                  defaultValue={localTask.admin_context || ''}
                  onBlur={e => saveField('admin_context', e.target.value)}
                  placeholder="Add context for agency..."
                  style={{ resize: 'vertical', fontSize: '13px' }}
                />
              ) : (
                localTask.admin_context && (
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', padding: '8px', background: 'rgba(249,115,22,0.05)', borderRadius: '6px', borderLeft: '2px solid var(--accent)' }}>
                    {localTask.admin_context}
                  </p>
                )
              )}
            </div>
          )}

          {/* Agency fields */}
          <div>
            <label>Status</label>
            <select
              value={localTask.status}
              onChange={e => saveField('status', e.target.value)}
              disabled={role === 'admin' && localTask.status === 'Verified'}
            >
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label>Agency Response</label>
            <textarea
              rows={3}
              defaultValue={localTask.agency_response || ''}
              onBlur={e => saveField('agency_response', e.target.value)}
              placeholder="Describe what was done..."
              style={{ resize: 'vertical', fontSize: '13px' }}
            />
          </div>

          <div>
            <label>Evidence Link (URL)</label>
            <input
              type="url"
              defaultValue={localTask.evidence_link || ''}
              onBlur={e => saveField('evidence_link', e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* Admin-only fields */}
          {role === 'admin' && (
            <>
              <div>
                <label>Due Date</label>
                <input
                  type="date"
                  defaultValue={localTask.due_date || ''}
                  onBlur={e => saveField('due_date', e.target.value)}
                />
              </div>

              {localTask.ai_verification_result && (
                <div style={{ background: '#1a1a1a', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ margin: 0 }}>AI Verification Result</label>
                    <StatusBadge verification={localTask.ai_verification_result} />
                  </div>
                  {localTask.ai_verification_reason && (
                    <p style={{ margin: '4px 0 8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {localTask.ai_verification_reason}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => saveField('admin_override', !localTask.admin_override)}
                    >
                      {localTask.admin_override ? 'Remove Override' : 'Admin Override'}
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {localTask.status === 'Done' && localTask.evidence_link && (
                  <button
                    className="btn-primary btn-sm"
                    onClick={handleVerify}
                    disabled={verifying}
                  >
                    {verifying ? <><span className="spinner" style={{ width: '12px', height: '12px' }} /> Verifying...</> : 'Verify with AI'}
                  </button>
                )}
                {onDelete && (
                  <button
                    className="btn-ghost btn-sm"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => onDelete(task.id)}
                  >
                    Delete Task
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function getCategoryColor(category: string): string {
  const map: Record<string, string> = {
    'SEO': '#3b82f6',
    'Google Ads': '#f59e0b',
    'Meta': '#a855f7',
    'GEO': '#22c55e',
    'Local': '#f97316',
  }
  return map[category] || '#6b7280'
}
