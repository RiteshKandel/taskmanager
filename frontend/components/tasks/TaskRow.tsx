'use client'
import { PriorityDot, PriorityBadge } from '@/components/ui/Badge'
import type { Task } from '@/lib/hooks/use-tasks'

interface TaskRowProps {
  task: Task
  onToggle: () => void
  onOpen: () => void
}

export function TaskRow({ task, onToggle, onOpen }: TaskRowProps) {
  const dueDate   = task.due_date ? new Date(task.due_date) : null
  const isOverdue = dueDate && dueDate < new Date() && !task.is_done
  const dueFmt    = dueDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div
      className="group flex items-center gap-3 px-3 rounded-[12px] cursor-pointer transition-all"
      style={{
        border: '1px solid transparent',
        minHeight: '44px',    /* minimum 44px tap target */
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'var(--bg-elevated)'
        e.currentTarget.style.borderColor = 'var(--border)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.borderColor = 'transparent'
      }}
      onClick={onOpen}
    >
      {/* Checkbox — 18px for better click target */}
      <button
        onClick={e => { e.stopPropagation(); onToggle() }}
        className="w-[18px] h-[18px] rounded flex-shrink-0 flex items-center justify-center transition-all"
        aria-label={task.is_done ? 'Mark as not done' : 'Mark as done'}
        style={{
          border: task.is_done ? 'none' : '1.5px solid var(--text-muted)',
          background: task.is_done ? 'var(--color-green)' : 'transparent',
        }}
      >
        {task.is_done && (
          /* 10px is fine here — decorative checkmark inside a small control */
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#0e0f14', lineHeight: 1 }}>✓</span>
        )}
      </button>

      {/* Priority dot */}
      <PriorityDot priority={task.priority} />

      {/* Title — 15px, primary color */}
      <span
        className="flex-1 leading-normal"
        style={{
          fontSize: '0.9375rem',   /* 15px — slightly tighter than body for density */
          color: task.is_done ? 'var(--text-muted)' : 'var(--text-primary)',
          textDecoration: task.is_done ? 'line-through' : 'none',
        }}
      >
        {task.title}
      </span>

      {/* Labels — 12px minimum */}
      {task.labels?.map((label: unknown) => {
        const l = label as { id: number; color: string; title: string }
        return (
          <span
            key={l.id}
            className="tag"
            style={{ background: l.color + '25', color: l.color }}
          >
            {l.title}
          </span>
        )
      })}

      {/* Priority badge — show on hover */}
      {task.priority > 0 && (
        <span className="opacity-0 group-hover:opacity-100 transition-opacity">
          <PriorityBadge priority={task.priority} />
        </span>
      )}

      {/* Assignee avatars — 20px, initials at 10px (decorative) */}
      {task.assignees?.length > 0 && (
        <div className="flex -space-x-1.5">
          {task.assignees.slice(0, 3).map((a: unknown) => {
            const assignee = a as { id: number; name?: string }
            return (
              <div
                key={assignee.id}
                title={assignee.name}
                className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-white"
                style={{
                  fontSize: '9px',   /* intentionally tiny — decorative avatar initial */
                  background: 'var(--accent)',
                  border: '1.5px solid var(--bg-base)',
                }}
              >
                {assignee.name?.[0]?.toUpperCase()}
              </div>
            )
          })}
        </div>
      )}

      {/* Subtask count — 12px */}
      {task.subtask_count > 0 && (
        <span
          className="tag"
          style={{
            background: 'var(--bg-active)',
            color: 'var(--text-secondary)',
            fontSize: '0.6875rem',   /* 11px decorative */
          }}
        >
          ⊞ {task.subtask_count}
        </span>
      )}

      {/* Due date — 12px, clear color coding */}
      {dueFmt && (
        <span
          style={{
            fontSize: '0.75rem',   /* 12px — acceptable for metadata */
            fontWeight: isOverdue ? 600 : 400,
            color: isOverdue ? 'var(--color-red)' : 'var(--text-secondary)',
            whiteSpace: 'nowrap',
          }}
        >
          {dueFmt}
        </span>
      )}
    </div>
  )
}
