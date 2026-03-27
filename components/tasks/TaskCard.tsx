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
  const [evidenceInput, setEvidenceInput] = useState(task.evidence_link || '')
  const [responseInput, setResponseInput] = useState(task.agency_response || '')

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
  const isAgency = role === 'agency'

  return (
    <div className="card" style={{ borderLeft: `3px solid ${getCategoryColor(localTask.category)}` }}>

      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '6px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', alignItems: 'center', marginBottom: '5px' }}>
            {localTask.category && <StatusBadge category={localTask.category} />}
            <StatusBadge status={localTask.status} />
            {localTask.ai_verification_result && !localTask.admin_override && (
              <StatusBadge verification={localTask.ai_verification_result} />
            )}
            {localTask.admin_override && (
              <span className="badge" style={{ background: 'rgba(249,115,22,0.2)', color: '#f97316' }}>Admin Override</span>
            )}
          </div>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', lineHeight: '1.35' }}>
            {localTask.title}
          </h3>
        </div>
        <button className="btn-ghost btn-sm" onClick={() => setExpanded(e => !e)} style={{ flexShrink: 0, fontSize: '11px' }}>
          {expanded ? '▲ Less' : '▼ More'}
        </button>
      </div>

      {/* Description */}
      <p style={{ margin: '0 0 10px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.55' }}>
        {localTask.description}
      </p>

      {/* Due date + saving indicator */}
      {(localTask.due_date || saving) && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
          {localTask.due_date && (
            <span>📅 {new Date(localTask.due_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          )}
          {saving && <span style={{ color: 'var(--accent)' }}>Saving…</span>}
        </div>
      )}

      {/* Admin context note (always visible if set) */}
      {localTask.admin_context && (
        <div style={{ marginBottom: '10px', padding: '8px 10px', background: 'rgba(249,115,22,0.06)', borderRadius: '6px', borderLeft: '2px solid var(--accent)' }}>
          <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Note from admin · </span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{localTask.admin_context}</span>
        </div>
      )}

      {/* ── AGENCY ACTION AREA — always visible ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

        {/* Status row */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ margin: 0, flexShrink: 0, width: '52px' }}>Status</label>
          <select
            value={localTask.status}
            onChange={e => { saveField('status', e.target.value); setLocalTask(p => ({ ...p, status: e.target.value as TaskStatus })) }}
            style={{ flex: 1 }}
          >
            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Evidence link — always visible, highlighted when status is Done */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <label style={{ margin: 0, flex: 1 }}>
              Evidence Link
              {localTask.status === 'Done' && !evidenceInput && (
                <span style={{ marginLeft: '6px', color: 'var(--danger)', fontSize: '11px', fontWeight: '600' }}>⚠ Required for verification</span>
              )}
              {evidenceInput && (
                <span style={{ marginLeft: '6px', color: 'var(--success)', fontSize: '11px' }}>✓ Provided</span>
              )}
            </label>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="url"
              value={evidenceInput}
              onChange={e => setEvidenceInput(e.target.value)}
              onBlur={e => saveField('evidence_link', e.target.value)}
              placeholder="Paste URL as evidence (e.g. updated page, live ad, GBP post…)"
              style={{ flex: 1, borderColor: localTask.status === 'Done' && !evidenceInput ? 'var(--danger)' : undefined }}
            />
            {evidenceInput && (
              <a href={evidenceInput} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', padding: '0 10px', background: 'var(--border)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}>
                Open ↗
              </a>
            )}
          </div>
        </div>

        {/* Response text — visible when expanded or already has content */}
        {(expanded || responseInput) && (
          <div>
            <label>Your Response</label>
            <textarea
              rows={2}
              value={responseInput}
              onChange={e => setResponseInput(e.target.value)}
              onBlur={e => saveField('agency_response', e.target.value)}
              placeholder="Briefly describe what was done…"
              style={{ resize: 'vertical', fontSize: '13px' }}
            />
          </div>
        )}
        {!expanded && !responseInput && (
          <button className="btn-ghost btn-sm" onClick={() => setExpanded(true)}
            style={{ alignSelf: 'flex-start', fontSize: '12px', padding: '2px 0', color: 'var(--text-muted)' }}>
            + Add response notes
          </button>
        )}
      </div>

      {/* ── EXPANDED: Admin-only fields ── */}
      {expanded && (
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="divider" />

          {role === 'admin' && (
            <div>
              <label>Admin Context / Notes (visible to agency)</label>
              <textarea
                rows={2}
                defaultValue={localTask.admin_context || ''}
                onBlur={e => saveField('admin_context', e.target.value)}
                placeholder="Add context or extra instructions for the agency…"
                style={{ resize: 'vertical', fontSize: '13px' }}
              />
            </div>
          )}

          {role === 'admin' && (
            <div>
              <label>Due Date</label>
              <input
                type="date"
                defaultValue={localTask.due_date || ''}
                onBlur={e => saveField('due_date', e.target.value)}
              />
            </div>
          )}

          {role === 'admin' && localTask.ai_verification_result && (
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

          {role === 'admin' && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {localTask.status === 'Done' && localTask.evidence_link && (
                <button className="btn-primary btn-sm" onClick={handleVerify} disabled={verifying}>
                  {verifying
                    ? <><span className="spinner" style={{ width: '12px', height: '12px' }} /> Verifying…</>
                    : '✦ Verify with AI'}
                </button>
              )}
              {onDelete && (
                <button className="btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => onDelete(task.id)}>
                  Delete
                </button>
              )}
            </div>
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
