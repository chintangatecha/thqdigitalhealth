'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Task, TaskStatus, UserRole, GeneratedTask, TaskCategory } from '@/lib/types'
import TaskCard from './TaskCard'
import GenerateModal from './GenerateModal'

interface TaskManagerProps {
  role: UserRole
}

const STATUS_FILTERS: ('All' | TaskStatus)[] = ['All', 'Pending', 'In Progress', 'Done', 'Verified', 'Failed']

export default function TaskManager({ role }: TaskManagerProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'All' | TaskStatus>('All')
  const [showGenerate, setShowGenerate] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchTasks = useCallback(async () => {
    let query = supabase.from('tasks').select('*').order('created_at', { ascending: false })
    if (role === 'agency') query = query.eq('approved', true)
    const { data } = await query
    setTasks(data || [])
    setLoading(false)
  }, [role])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  function openAdd() {
    setAdding(true)
    setNewTitle('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function cancelAdd() {
    setAdding(false)
    setNewTitle('')
  }

  async function submitAdd(e?: React.FormEvent) {
    e?.preventDefault()
    const title = newTitle.trim()
    if (!title) return cancelAdd()
    setSaving(true)
    const { data } = await supabase.from('tasks').insert({
      title,
      status: 'Pending',
      approved: true,   // goes straight to agency
    }).select()
    if (data) setTasks(prev => [...data, ...prev])
    setAdding(false)
    setNewTitle('')
    setSaving(false)
  }

  async function handleUpdate(id: string, updates: Partial<Task>) {
    await supabase.from('tasks').update(updates).eq('id', id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this task?')) return
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  async function handleApproveGenerated(generated: GeneratedTask[]) {
    const rows = generated.map(t => ({
      title: t.title,
      description: t.description,
      category: t.category,
      status: 'Pending' as TaskStatus,
      approved: false,
    }))
    const { data } = await supabase.from('tasks').insert(rows).select()
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
    await handleUpdate(task.id, {
      ai_verification_result: data.result,
      ai_verification_reason: data.reason,
      status: data.result === 'Pass' ? 'Verified' : task.status,
    })
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
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className="btn-secondary btn-sm"
              onClick={openAdd}
              style={{ fontSize: '18px', lineHeight: 1, padding: '3px 11px', fontWeight: 400 }}
              title="Add task"
            >
              +
            </button>
            <button className="btn-primary btn-sm" onClick={() => setShowGenerate(true)}>
              ✦ Generate with AI
            </button>
          </div>
        )}
      </div>

      <div className="quadrant-body">

        {/* Inline quick-add input */}
        {adding && (
          <form onSubmit={submitAdd} style={{ marginBottom: '12px', display: 'flex', gap: '6px' }}>
            <input
              ref={inputRef}
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Escape' && cancelAdd()}
              placeholder="Task title — press Enter to save, Esc to cancel"
              style={{ flex: 1 }}
              disabled={saving}
            />
            <button type="submit" className="btn-primary btn-sm" disabled={saving || !newTitle.trim()}>
              {saving ? '…' : 'Add'}
            </button>
            <button type="button" className="btn-secondary btn-sm" onClick={cancelAdd}>✕</button>
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
                <button className="btn-secondary btn-sm" onClick={openAdd}>+ Add Task</button>
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
