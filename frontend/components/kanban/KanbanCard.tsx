'use client'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '@/lib/hooks/use-tasks'

const PRIORITY_COLORS = ['', '#60a5fa', '#fbbf24', '#fb923c', '#f87171']

interface KanbanCardProps {
  task: Task
  isOverlay?: boolean
  onOpen?: (task: Task) => void
}

export function KanbanCard({ task, isOverlay = false, onOpen }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const dueDate    = task.due_date ? new Date(task.due_date) : null
  const isOverdue  = dueDate && dueDate < new Date() && !task.is_done
  const dueDateStr = dueDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const cardStyle: React.CSSProperties = {
    transform: isOverlay ? 'rotate(1.5deg) scale(1.03)' : CSS.Transform.toString(transform),
    transition,
    background: isDragging ? 'var(--bg-active)' : 'var(--bg-elevated)',
    border: `1px solid ${isDragging ? 'var(--accent)' : 'var(--border)'}`,
    opacity: isDragging ? 0.5 : 1,
    boxShadow: isOverlay ? '0 12px 32px rgba(0,0,0,.5), 0 0 0 1px var(--accent-dim)' : 'none',
  }

  const cardStyleWithPadding: React.CSSProperties = { ...cardStyle, padding: '12px 14px' }

  return (
    <div
      ref={setNodeRef}
      style={cardStyleWithPadding}
      {...attributes}
      {...listeners}
      onClick={() => onOpen?.(task)}
      className="rounded-[14px] cursor-grab active:cursor-grabbing select-none transition-all"
    >
      {/* Priority indicator line at top */}
      {task.priority > 0 && (
        <div
          className="w-8 h-0.5 rounded-full mb-2.5"
          style={{ background: PRIORITY_COLORS[task.priority] }}
        />
      )}

      {/* Title — 14px, full primary color */}
      <p
        style={{
          fontSize: '0.875rem',   /* 14px */
          lineHeight: '1.5',
          marginBottom: '10px',
          color: task.is_done ? 'var(--text-muted)' : 'var(--text-primary)',
          textDecoration: task.is_done ? 'line-through' : 'none',
        }}
      >
        {task.title}
      </p>

      {/* Labels — 12px minimum via .tag */}
      {task.labels?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {task.labels.map((label: unknown) => {
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
        </div>
      )}

      {/* Footer row — 12px metadata */}
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        {dueDateStr && (
          <span
            style={{
              fontSize: '0.75rem',   /* 12px — metadata */
              fontWeight: isOverdue ? 600 : 400,
              color: isOverdue ? 'var(--color-red)' : 'var(--text-secondary)',
            }}
          >
            📅 {dueDateStr}
          </span>
        )}
        {task.subtask_count > 0 && (
          <span
            style={{
              fontSize: '0.75rem',   /* 12px */
              color: 'var(--text-secondary)',
              marginLeft: 'auto',
            }}
          >
            ⊞ {task.subtask_count}
          </span>
        )}
        {task.assignees?.length > 0 && (
          <div className="flex -space-x-1.5 ml-auto">
            {task.assignees.slice(0, 3).map((a: unknown) => {
              const assignee = a as { id: number; name?: string }
              return (
                <div
                  key={assignee.id}
                  title={assignee.name}
                  className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-white"
                  style={{
                    fontSize: '9px',   /* decorative avatar initial */
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
      </div>
    </div>
  )
}