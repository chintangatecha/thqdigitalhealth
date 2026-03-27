'use client'

import { useState, useEffect } from 'react'
import { GeneratedTask, TaskCategory } from '@/lib/types'

interface GenerateModalProps {
  onClose: () => void
  onApprove: (tasks: GeneratedTask[]) => void
}

interface DraftTask extends GeneratedTask {
  key: string
  state: 'pending' | 'approved' | 'discarded'
  editing: boolean
}

export default function GenerateModal({ onClose, onApprove }: GenerateModalProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [drafts, setDrafts] = useState<DraftTask[]>([])

  useEffect(() => {
    generateTasks()
  }, [])

  async function generateTasks() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/generate-tasks', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to generate tasks')
      const data = await res.json()
      setDrafts(data.tasks.map((t: GeneratedTask, i: number) => ({
        ...t,
        key: `${Date.now()}-${i}`,
        state: 'pending' as const,
        editing: false,
      })))
    } catch {
      setError('Failed to generate tasks. Please try again.')
    }
    setLoading(false)
  }

  function updateDraft(key: string, updates: Partial<DraftTask>) {
    setDrafts(prev => prev.map(d => d.key === key ? { ...d, ...updates } : d))
  }

  function handleApproveAll() {
    const approved = drafts
      .filter(d => d.state !== 'discarded')
      .map(({ title, description, category }) => ({ title, description, category }))
    onApprove(approved)
  }

  function handleApproveSelected() {
    const approved = drafts
      .filter(d => d.state === 'approved')
      .map(({ title, description, category }) => ({ title, description, category }))
    if (approved.length === 0) return alert('Approve at least one task first')
    onApprove(approved)
  }

  const approvedCount = drafts.filter(d => d.state === 'approved').length

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>AI Generated Tasks</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Review, edit or discard before sending to agency
            </p>
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ fontSize: '18px', padding: '4px 8px' }}>✕</button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div className="spinner" style={{ width: '32px', height: '32px', margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              Analysing metrics and generating tasks...
            </p>
          </div>
        )}

        {error && (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <p style={{ color: 'var(--danger)', marginBottom: '12px' }}>{error}</p>
            <button className="btn-primary" onClick={generateTasks}>Try Again</button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className="btn-secondary btn-sm" onClick={() => setDrafts(prev => prev.map(d => ({ ...d, state: 'approved' })))}>
                Approve All
              </button>
              <button className="btn-ghost btn-sm" onClick={() => setDrafts(prev => prev.map(d => ({ ...d, state: 'discarded' })))}>
                Discard All
              </button>
              <button className="btn-ghost btn-sm" onClick={generateTasks}>
                Regenerate
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {drafts.map(draft => (
                <div key={draft.key} className="card" style={{
                  opacity: draft.state === 'discarded' ? 0.4 : 1,
                  borderLeft: `3px solid ${draft.state === 'approved' ? 'var(--success)' : draft.state === 'discarded' ? 'var(--danger)' : 'var(--border-light)'}`,
                }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      {draft.editing ? (
                        <input
                          type="text"
                          defaultValue={draft.title}
                          onBlur={e => updateDraft(draft.key, { title: e.target.value, editing: false })}
                          autoFocus
                          style={{ marginBottom: '6px', fontWeight: '600' }}
                        />
                      ) : (
                        <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {draft.title}
                        </p>
                      )}
                      <p style={{ margin: '0 0 6px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                        {draft.description}
                      </p>
                      <CategoryBadge category={draft.category} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
                      <button
                        className="btn-sm"
                        style={{
                          background: draft.state === 'approved' ? 'rgba(34,197,94,0.2)' : 'transparent',
                          color: draft.state === 'approved' ? '#4ade80' : 'var(--text-muted)',
                          border: `1px solid ${draft.state === 'approved' ? '#4ade80' : 'var(--border-light)'}`,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          padding: '4px 10px',
                        }}
                        onClick={() => updateDraft(draft.key, { state: draft.state === 'approved' ? 'pending' : 'approved' })}
                      >
                        ✓ {draft.state === 'approved' ? 'Approved' : 'Approve'}
                      </button>
                      <button
                        className="btn-ghost btn-sm"
                        onClick={() => updateDraft(draft.key, { editing: !draft.editing })}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-ghost btn-sm"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => updateDraft(draft.key, { state: draft.state === 'discarded' ? 'pending' : 'discarded' })}
                      >
                        {draft.state === 'discarded' ? 'Restore' : 'Discard'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <button className="btn-secondary" onClick={onClose}>Cancel</button>
              {approvedCount > 0 && (
                <button className="btn-secondary" onClick={handleApproveSelected}>
                  Save Approved ({approvedCount})
                </button>
              )}
              <button className="btn-primary" onClick={handleApproveAll}>
                Save All Tasks
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function CategoryBadge({ category }: { category: TaskCategory }) {
  const classMap: Record<TaskCategory, string> = {
    'SEO': 'badge badge-seo',
    'Google Ads': 'badge badge-ads',
    'Meta': 'badge badge-meta',
    'GEO': 'badge badge-geo',
    'Local': 'badge badge-local',
  }
  return <span className={classMap[category]}>{category}</span>
}
