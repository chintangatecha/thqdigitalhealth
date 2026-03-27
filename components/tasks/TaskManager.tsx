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

export default function TaskManager({ role }: TaskManagerProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'All' | TaskStatus>('All')
  const [showGenerate, setShowGenerate] = useState(false)

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

  async function handleApproveGenerated(generated: GeneratedTask[]) {
    const newTasks = generated.map(t => ({
      title: t.title,
      description: t.description,
      category: t.category,
      status: 'Pending' as TaskStatus,
      approved: false,
    }))
    const { data } = await supabase.from('tasks').insert(newTasks).select()
    if (data) {
      setTasks(prev => [...data, ...prev])
    }
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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {role === 'admin' && (
            <button className="btn-primary btn-sm" onClick={() => setShowGenerate(true)}>
              ✦ Generate Tasks with AI
            </button>
          )}
        </div>
      </div>

      <div className="quadrant-body">
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
              <button className="btn-primary btn-sm" style={{ marginTop: '12px' }} onClick={() => setShowGenerate(true)}>
                Generate Tasks with AI
              </button>
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
