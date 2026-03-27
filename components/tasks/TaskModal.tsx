'use client'

import { useState } from 'react'
import { Task, TaskStatus, UserRole } from '@/lib/types'
import StatusBadge from '@/components/ui/StatusBadge'

interface TaskModalProps {
  task: Task
  role: UserRole
  onClose: () => void
  onUpdate: (id: string, updates: Partial<Task>) => Promise<void>
  onDelete?: (id: string) => void
  onVerify?: (task: Task) => void
}

export default function TaskModal({ task, role, onClose, onUpdate, onDelete, onVerify }: TaskModalProps) {
  const [localTask, setLocalTask] = useState(task)
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [evidenceInput, setEvidenceInput] = useState(task.evidence_link || '')
  const [responseInput, setResponseInput] = useState(task.agency_response || '')

  async function saveField(field: keyof Task, value: string | boolean | null) {
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

  async function handleDelete() {
    if (!onDelete) return
    if (!confirm('Delete this task?')) return
    await onDelete(task.id)
    onClose()
  }

  const statusOptions: TaskStatus[] = ['Pending', 'In Progress', 'Done', 'Verified', 'Failed']

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '560px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '8px' }}>
              {localTask.category && <StatusBadge category={localTask.category} />}
              <StatusBadge status={localTask.status} />
              {localTask.ai_verification_result && !localTask.admin_override && (
                <StatusBadge verification={localTask.ai_verification_result} />
              )}
              {localTask.admin_override && (
                <span className="badge" style={{ background: 'rgba(249,115,22,0.2)', color: '#f97316' }}>Admin Override</span>
              )}
            </div>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', lineHeight: '1.35', color: 'var(--text-primary)' }}>
              {localTask.title}
            </h2>
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ fontSize: '18px', padding: '2px 8px', flexShrink: 0 }}>✕</button>
        </div>

        {/* Description */}
        {localTask.description && (
          <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
            {localTask.description}
          </p>
        )}

        {/* Admin context note */}
        {localTask.admin_context && (
          <div style={{ marginBottom: '14px', padding: '8px 12px', background: 'rgba(249,115,22,0.06)', borderRadius: '6px', borderLeft: '2px solid var(--accent)' }}>
            <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Note · </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{localTask.admin_context}</span>
          </div>
        )}

        <div className="divider" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' }}>

          {/* Status */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{ margin: 0, width: '100px', flexShrink: 0 }}>Status</label>
            <select
              value={localTask.status}
              onChange={e => { const v = e.target.value as TaskStatus; saveField('status', v); setLocalTask(p => ({ ...p, status: v })) }}
              style={{ flex: 1 }}
            >
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Evidence link */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
              <label style={{ margin: 0, flex: 1 }}>
                Evidence Link
                {localTask.status === 'Done' && !evidenceInput && (
                  <span style={{ marginLeft: '6px', color: 'var(--danger)', fontSize: '11px', fontWeight: '600' }}>⚠ Required for verification</span>
                )}
                {evidenceInput && <span style={{ marginLeft: '6px', color: 'var(--success)', fontSize: '11px' }}>✓</span>}
              </label>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="url"
                value={evidenceInput}
                onChange={e => setEvidenceInput(e.target.value)}
                onBlur={e => saveField('evidence_link', e.target.value)}
                placeholder="Paste URL as evidence…"
                style={{ flex: 1, borderColor: localTask.status === 'Done' && !evidenceInput ? 'var(--danger)' : undefined }}
              />
              {evidenceInput && (
                <a href={evidenceInput} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: 'var(--border)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none', flexShrink: 0 }}>
                  Open ↗
                </a>
              )}
            </div>
          </div>

          {/* Agency response */}
          <div>
            <label>Response Notes</label>
            <textarea
              rows={3}
              value={responseInput}
              onChange={e => setResponseInput(e.target.value)}
              onBlur={e => saveField('agency_response', e.target.value)}
              placeholder="Briefly describe what was done…"
              style={{ resize: 'vertical', fontSize: '13px' }}
            />
          </div>

          {/* Admin-only fields */}
          {role === 'admin' && (
            <>
              <div>
                <label>Admin Notes (visible to agency)</label>
                <textarea
                  rows={2}
                  defaultValue={localTask.admin_context || ''}
                  onBlur={e => saveField('admin_context', e.target.value)}
                  placeholder="Add context or extra instructions…"
                  style={{ resize: 'vertical', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <label style={{ margin: 0, width: '100px', flexShrink: 0 }}>Due Date</label>
                <input
                  type="date"
                  defaultValue={localTask.due_date || ''}
                  onBlur={e => saveField('due_date', e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>

              {localTask.ai_verification_result && (
                <div style={{ background: '#1a1a1a', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ margin: 0 }}>AI Verification</label>
                    <StatusBadge verification={localTask.ai_verification_result} />
                  </div>
                  {localTask.ai_verification_reason && (
                    <p style={{ margin: '4px 0 8px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      {localTask.ai_verification_reason}
                    </p>
                  )}
                  <button className="btn-secondary btn-sm" onClick={() => saveField('admin_override', !localTask.admin_override)}>
                    {localTask.admin_override ? 'Remove Override' : 'Admin Override'}
                  </button>
                </div>
              )}
            </>
          )}

          {saving && <p style={{ margin: 0, fontSize: '12px', color: 'var(--accent)' }}>Saving…</p>}
        </div>

        {/* Footer actions */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {role === 'admin' && localTask.status === 'Done' && localTask.evidence_link && (
              <button className="btn-primary btn-sm" onClick={handleVerify} disabled={verifying}>
                {verifying ? <><span className="spinner" style={{ width: '12px', height: '12px' }} /> Verifying…</> : '✦ Verify with AI'}
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {role === 'admin' && onDelete && (
              <button className="btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={handleDelete}>Delete</button>
            )}
            <button className="btn-secondary btn-sm" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  )
}
