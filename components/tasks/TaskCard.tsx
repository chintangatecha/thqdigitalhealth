'use client'

import { useState } from 'react'
import { Task, UserRole } from '@/lib/types'
import StatusBadge from '@/components/ui/StatusBadge'
import TaskModal from './TaskModal'

interface TaskCardProps {
  task: Task
  role: UserRole
  onUpdate: (id: string, updates: Partial<Task>) => Promise<void>
  onDelete?: (id: string) => void
  onVerify?: (task: Task) => void
}

export default function TaskCard({ task, role, onUpdate, onDelete, onVerify }: TaskCardProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '9px 12px',
          borderRadius: '8px',
          borderLeft: `3px solid ${getCategoryColor(task.category)}`,
          background: '#1e1e1e',
          cursor: 'pointer',
          marginBottom: '4px',
          transition: 'background 0.12s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#252525')}
        onMouseLeave={e => (e.currentTarget.style.background = '#1e1e1e')}
      >
        {/* Category + status badges */}
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          {task.category && <StatusBadge category={task.category} />}
          <StatusBadge status={task.status} />
        </div>

        {/* Title */}
        <span style={{
          flex: 1,
          fontSize: '13px',
          fontWeight: '500',
          color: 'var(--text-primary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: 0,
        }}>
          {task.title}
        </span>

        {/* Due date */}
        {task.due_date && (
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
            {new Date(task.due_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
          </span>
        )}

        {/* Evidence indicator */}
        {task.evidence_link && (
          <span style={{ fontSize: '11px', color: 'var(--success)', flexShrink: 0 }} title="Evidence provided">●</span>
        )}

        {/* Chevron */}
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>›</span>
      </div>

      {open && (
        <TaskModal
          task={task}
          role={role}
          onClose={() => setOpen(false)}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onVerify={onVerify}
        />
      )}
    </>
  )
}

function getCategoryColor(category: string | null): string {
  if (!category) return '#444'
  const map: Record<string, string> = {
    'SEO': '#3b82f6',
    'Google Ads': '#f59e0b',
    'Meta': '#a855f7',
    'GEO': '#22c55e',
    'Local': '#f97316',
  }
  return map[category] || '#6b7280'
}
