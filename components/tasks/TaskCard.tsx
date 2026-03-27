'use client'

import { useState } from 'react'
import { Task, UserRole } from '@/lib/types'
import StatusBadge from '@/components/ui/StatusBadge'
import TaskModal from './TaskModal'

interface TaskCardProps {
  task: Task
  role: UserRole
  selected?: boolean
  onSelect?: (id: string, checked: boolean) => void
  onUpdate: (id: string, updates: Partial<Task>) => Promise<void>
  onDelete?: (id: string) => void
  onVerify?: (task: Task) => void
}

export default function TaskCard({ task, role, selected, onSelect, onUpdate, onDelete, onVerify }: TaskCardProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '9px 12px',
          borderRadius: '8px',
          borderLeft: `3px solid ${selected ? 'var(--danger)' : getCategoryColor(task.category)}`,
          background: selected ? 'rgba(239,68,68,0.06)' : '#1e1e1e',
          marginBottom: '4px',
          transition: 'background 0.12s',
        }}
        onMouseEnter={e => { if (!selected) e.currentTarget.style.background = '#252525' }}
        onMouseLeave={e => { if (!selected) e.currentTarget.style.background = '#1e1e1e' }}
      >
        {/* Checkbox — admin only */}
        {onSelect && (
          <input
            type="checkbox"
            checked={!!selected}
            onChange={e => onSelect(task.id, e.target.checked)}
            onClick={e => e.stopPropagation()}
            style={{ width: '14px', height: '14px', flexShrink: 0, accentColor: 'var(--danger)', cursor: 'pointer' }}
          />
        )}

        {/* Clickable row area */}
        <div
          onClick={() => setOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0, cursor: 'pointer' }}
        >
          {/* Badges */}
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

          {/* Evidence dot */}
          {task.evidence_link && (
            <span style={{ fontSize: '11px', color: 'var(--success)', flexShrink: 0 }} title="Evidence provided">●</span>
          )}

          <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>›</span>
        </div>
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
