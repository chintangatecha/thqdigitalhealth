'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Task, TaskStatus, UserRole, GeneratedTask, TaskCategory } from '@/lib/types'
import TaskCard from './TaskCard'
import GenerateModal from './GenerateModal'

interface TaskManagerProps {
  role: UserRole
}

const STATUS_FILTERS: ('All' | TaskStatus)[] = ['All', 'Pending', 'In Progress', 'Done', 'Verified', 'Failed']
const CATEGORIES: TaskCategory[] = ['SEO', 'Google Ads', 'Meta', 'GEO', 'Local']

const EMPTY_FORM = { title: '', description: '', category: 'SEO' as TaskCategory, due_date: '' }

export default function TaskManager({ role }: TaskManagerProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'All' | TaskStatus>('All')
  const [showGenerate, setShowGenerate] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const fetchTasks = useCallback(async () => {
    let query = supabase.from('tasks').select('*').order('created_at', { ascending: false })
    if (role === 'agency') {
      query = query.eq('approved', true)
    }
    const { data } = await query
    setTasks(data || [])
    setLoading(false)
  }, [role])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  async function handleUpdate(id: string, updates: Partial<Task>) {
    await supabase.from('tasks').update(updates).eq('id', id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this task?')) return
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  async function handleAddManual(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      due_date: form.due_date || null,
      status: 'Pending' as TaskStatus,
      approved: false,
    }
    const { data } = await supabase.from('tasks').insert(payload).select()
    if (data) setTasks(prev => [...data, ...prev])
    setForm(EMPTY_FORM)
    setShowAddForm(false)
    setSaving(false)
  }

  async function handleApproveGenerated(generated: GeneratedTask[]) {
    const newTasks = generated.map(t => ({
      title: t.title,
      description: t.description,
      category: t.category,
      status: 'Pending' as TaskStatus,
      approved: false,
    }))
    const { data } = await supabase.from('tasks').insert(newTasks).select()
    if (data) setTasks(prev => [...data, ...prev])
    setShowGenerate(false)
  }

  async function handleVerify(task: Task) {
    const res = await fetch('/api/verify-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskTitle: task.title,
        taskDescription: task.description,
        category: task.category,
        evidenceLink: task.evidence_link,
        agencyResponse: task.agency_response,
      }),
    })
    const data = await res.json()
    const updates = {
      ai_verification_result: data.result,
      ai_verification_reason: data.reason,
      status: data.result === 'Pass' ? 'Verified' as TaskStatus : task.status,
    }
    await handleUpdate(task.id, updates)
  }

  const filtered = filter === 'All' ? tasks : tasks.filter(t => t.status === filter)

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <span className="spinner" style={{ width: '24px', height: '24px' }} />
      </div>
    )
  }

  return (
    <>
      <div className="quadrant-header">
        <span className="quadrant-title">Task Manager</span>
        {role === 'admin' && (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button className="btn-secondary btn-sm" onClick={() => { setShowAddForm(v => !v); setShowGenerate(false) }}>
              + Add Task
            </button>
            <button className="btn-primary btn-sm" onClick={() => { setShowGenerate(true); setShowAddForm(false) }}>
              ✦ Generate with AI
            </button>
          </div>
        )}
      </div>

      <div className="quadrant-body">
        {/* Inline add task form */}
        {showAddForm && role === 'admin' && (
          <form onSubmit={handleAddManual} style={{
            background: '#1a1a1a',
            border: '1px solid var(--accent)',
            borderRadius: '10px',
            padding: '14px',
            marginBottom: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>New Task</span>
              <button type="button" className="btn-ghost" onClick={() => setShowAddForm(false)} style={{ fontSize: '16px', padding: '2px 6px' }}>✕</button>
            </div>
            <div>
              <label>Task Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Update meta descriptions for VIC decking range"
                autoFocus
                required
              />
            </div>
            <div>
              <label>Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Detailed instructions for the agency..."
                style={{ resize: 'vertical', fontSize: '13px' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as TaskCategory }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label>Due Date</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary btn-sm" onClick={() => setShowAddForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary btn-sm" disabled={saving || !form.title.trim()}>
                {saving ? 'Saving...' : 'Save Task'}
              </button>
            </div>
          </form>
        )}

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '14px' }}>
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              className={`filter-tab${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
              {f !== 'All' && (
                <span style={{ marginLeft: '4px', opacity: 0.7 }}>
                  ({tasks.filter(t => t.status === f).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
            <p style={{ margin: 0, fontSize: '13px' }}>
              {filter === 'All' ? 'No tasks yet.' : `No ${filter} tasks.`}
            </p>
            {role === 'admin' && filter === 'All' && (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
                <button className="btn-secondary btn-sm" onClick={() => setShowAddForm(true)}>+ Add Task</button>
                <button className="btn-primary btn-sm" onClick={() => setShowGenerate(true)}>✦ Generate with AI</button>
              </div>
            )}
          </div>
        ) : (
          filtered.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              role={role}
              onUpdate={handleUpdate}
              onDelete={role === 'admin' ? handleDelete : undefined}
              onVerify={role === 'admin' ? handleVerify : undefined}
            />
          ))
        )}
      </div>

      {showGenerate && (
        <GenerateModal
          onClose={() => setShowGenerate(false)}
          onApprove={handleApproveGenerated}
        />
      )}
    </>
  )
}
