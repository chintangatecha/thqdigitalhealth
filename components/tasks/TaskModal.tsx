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
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)

  // All editable fields as controlled state
  const [title, setTitle] = useState(task.title || '')
  const [description, setDescription] = useState(task.description || '')
  const [status, setStatus] = useState<TaskStatus>(task.status)
  const [evidenceLink, setEvidenceLink] = useState(task.evidence_link || '')
  const [agencyResponse, setAgencyResponse] = useState(task.agency_response || '')
  const [adminContext, setAdminContext] = useState(task.admin_context || '')
  const [dueDate, setDueDate] = useState(task.due_date || '')
  const [adminOverride, setAdminOverride] = useState(task.admin_override || false)
  const [aiResult] = useState(task.ai_verification_result)
  const [aiReason] = useState(task.ai_verification_reason)

  async function save(updates: Partial<Task>) {
    setSaving(true)
    await onUpdate(task.id, updates)
    setSaving(false)
  }

  async function handleVerify() {
    if (!onVerify) return
    setVerifying(true)
    await onVerify({ ...task, title, description, status, evidence_link: evidenceLink, agency_response: agencyResponse })
    setVerifying(false)
  }

  async function handleDelete() {
    if (!onDelete) return
    if (!confirm('Delete this task?')) return
    await onDelete(task.id)
    onClose()
  }

  async function handleOverrideToggle() {
    const next = !adminOverride
    setAdminOverride(next)
    await save({ admin_override: next })
  }

  const statusOptions: TaskStatus[] = ['Pending', 'In Progress', 'Done', 'Verified', 'Failed']

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '580px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {task.category && <StatusBadge category={task.category} />}
            <StatusBadge status={status} />
            {aiResult && !adminOverride && <StatusBadge verification={aiResult} />}
            {adminOverride && <span className="badge" style={{ background: 'rgba(249,115,22,0.2)', color: '#f97316' }}>Admin Override</span>}
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ fontSize: '18px', padding: '2px 8px', flexShrink: 0 }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Title */}
          <div>
            <label>Task Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={() => title.trim() && save({ title: title.trim() })}
              placeholder="Task title…"
              style={{ fontWeight: '600', fontSize: '14px' }}
              readOnly={role === 'agency'}
            />
          </div>

          {/* Description */}
          <div>
            <label>Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              onBlur={() => save({ description })}
              placeholder="What needs to be done…"
              style={{ resize: 'vertical', fontSize: '13px' }}
              readOnly={role === 'agency'}
            />
          </div>

          {/* Admin notes (read-only display for agency, editable for admin) */}
          {role === 'admin' && (
            <div>
              <label>Admin Notes <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(visible to agency)</span></label>
              <textarea
                rows={2}
                value={adminContext}
                onChange={e => setAdminContext(e.target.value)}
                onBlur={() => save({ admin_context: adminContext })}
                placeholder="Extra context or instructions for the agency…"
                style={{ resize: 'vertical', fontSize: '13px' }}
              />
            </div>
          )}
          {role === 'agency' && adminContext && (
            <div style={{ padding: '8px 12px', background: 'rgba(249,115,22,0.06)', borderRadius: '6px', borderLeft: '2px solid var(--accent)' }}>
              <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Note · </span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{adminContext}</span>
            </div>
          )}

          <div className="divider" style={{ margin: '2px 0' }} />

          {/* Status */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{ margin: 0, width: '110px', flexShrink: 0 }}>Status</label>
            <select
              value={status}
              onChange={e => { const v = e.target.value as TaskStatus; setStatus(v); save({ status: v }) }}
              style={{ flex: 1 }}
            >
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Due date — admin only */}
          {role === 'admin' && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <label style={{ margin: 0, width: '110px', flexShrink: 0 }}>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                onBlur={() => save({ due_date: dueDate || null })}
                style={{ flex: 1 }}
              />
            </div>
          )}

          {/* Evidence link */}
          <div>
            <label>
              Evidence Link
              {status === 'Done' && !evidenceLink && (
                <span style={{ marginLeft: '6px', color: 'var(--danger)', fontSize: '11px', fontWeight: '600' }}>⚠ Required for verification</span>
              )}
              {evidenceLink && <span style={{ marginLeft: '6px', color: 'var(--success)', fontSize: '11px' }}>✓</span>}
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="url"
                value={evidenceLink}
                onChange={e => setEvidenceLink(e.target.value)}
                onBlur={() => save({ evidence_link: evidenceLink })}
                placeholder="Paste URL as evidence…"
                style={{ flex: 1, borderColor: status === 'Done' && !evidenceLink ? 'var(--danger)' : undefined }}
              />
              {evidenceLink && (
                <a href={evidenceLink} target="_blank" rel="noopener noreferrer"
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
              value={agencyResponse}
              onChange={e => setAgencyResponse(e.target.value)}
              onBlur={() => save({ agency_response: agencyResponse })}
              placeholder="Briefly describe what was done…"
              style={{ resize: 'vertical', fontSize: '13px' }}
            />
          </div>

          {/* AI verification result — admin only */}
          {role === 'admin' && aiResult && (
            <div style={{ background: '#1a1a1a', borderRadius: '8px', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ margin: 0 }}>AI Verification</label>
                <StatusBadge verification={aiResult} />
              </div>
              {aiReason && (
                <p style={{ margin: '4px 0 8px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {aiReason}
                </p>
              )}
              <button className="btn-secondary btn-sm" onClick={handleOverrideToggle}>
                {adminOverride ? 'Remove Override' : 'Admin Override'}
              </button>
            </div>
          )}

          {saving && <p style={{ margin: 0, fontSize: '12px', color: 'var(--accent)' }}>Saving…</p>}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <div>
            {role === 'admin' && status === 'Done' && evidenceLink && (
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
