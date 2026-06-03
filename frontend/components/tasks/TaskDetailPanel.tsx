'use client'
import { useState } from 'react'
import { useTask, useUpdateTask } from '@/lib/hooks/use-tasks'
import type { Task } from '@/lib/hooks/use-tasks'

interface Props {
  task: Task
  projectId: number
  onClose: () => void
}

export function TaskDetailPanel({ task, projectId, onClose }: Props) {
  const { data: detail } = useTask(task.id)
  const updateTask = useUpdateTask(projectId)
  const [title, setTitle] = useState(task.title)

  const save = (field: Partial<Task>) =>
    updateTask.mutate({ id: task.id, ...field })

  /* Shared style for field control selects/inputs */
  const controlStyle: React.CSSProperties = {
    background: 'var(--bg-active)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',   /* primary, not secondary — readable */
    borderRadius: '8px',
    padding: '6px 10px',
    fontSize: '0.875rem',   /* 14px — readable form controls */
    outline: 'none',
    fontFamily: 'inherit',
  }

  const fields = [
    {
      label: 'Status',
      content: (
        <select
          value={detail?.status || task.status}
          onChange={e => save({ status: e.target.value })}
          style={controlStyle}
        >
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      ),
    },
    {
      label: 'Priority',
      content: (
        <select
          value={detail?.priority ?? task.priority}
          onChange={e => save({ priority: Number(e.target.value) })}
          style={controlStyle}
        >
          <option value="0">None</option>
          <option value="1">Low</option>
          <option value="2">Medium</option>
          <option value="3">High</option>
          <option value="4">Urgent</option>
        </select>
      ),
    },
    {
      label: 'Start date',
      content: (
        <input
          type="datetime-local"
          value={detail?.start_date ? detail.start_date.slice(0, 16) : ''}
          onChange={e => save({ start_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
          style={controlStyle}
        />
      ),
    },
    {
      label: 'Due date',
      content: (
        <input
          type="datetime-local"
          value={detail?.due_date ? detail.due_date.slice(0, 16) : ''}
          onChange={e => save({ due_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
          style={controlStyle}
        />
      ),
    },
  ]

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,.45)' }}
        onClick={onClose}
      />

      <div
        className="fixed right-0 top-0 h-full flex flex-col z-50"
        style={{
          width: '400px',            /* slightly wider for comfort */
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border)',
          animation: 'slideInRight .25s ease',
        }}
      >
        {/* Header */}
        <div
          className="flex items-start gap-3 px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={() => save({ title })}
            className="flex-1 bg-transparent outline-none leading-snug font-semibold"
            style={{
              fontSize: '1rem',      /* 16px — task title should be body size */
              color: 'var(--text-primary)',
              lineHeight: 1.4,
            }}
          />
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-[8px] flex items-center justify-center flex-shrink-0 transition-colors"
            style={{
              background: 'var(--bg-active)',
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
            }}
            aria-label="Close panel"
          >
            ✕
          </button>
        </div>

        {/* Fields */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
          {fields.map(f => (
            <div
              key={f.label}
              className="flex items-center gap-4 py-2.5"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              {/* Field label — 13px, secondary color — readable */}
              <span
                className="flex-shrink-0 font-medium"
                style={{
                  width: '80px',
                  fontSize: '0.8125rem',   /* 13px */
                  color: 'var(--text-secondary)',
                  lineHeight: 1.4,
                }}
              >
                {f.label}
              </span>
              {f.content}
            </div>
          ))}

          {/* Description section */}
          <div className="pt-5">
            <p
              className="section-label mb-3"
            >
              Description
            </p>
            <textarea
              rows={5}
              defaultValue={detail?.description || ''}
              placeholder="Add a description…"
              className="w-full resize-none rounded-[12px] outline-none transition-all"
              style={{
                padding: '12px 14px',
                fontSize: '0.9375rem',
                lineHeight: '1.65',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--border-focus)')}
              onBlur={e => {
                e.target.style.borderColor = 'var(--border)'
                save({ description: e.target.value })
              }}
            />
          </div>

          {/* Subtasks */}
          {detail?.subtasks?.length > 0 && (
            <div className="pt-4">
              <p className="section-label mb-3">
                Subtasks ({detail.subtasks.filter((s: Task) => s.is_done).length}/{detail.subtasks.length})
              </p>
              <div className="space-y-1.5">
                {detail.subtasks.map((sub: Task) => (
                  <div
                    key={sub.id}
                    className="flex items-center gap-2"
                    style={{
                      fontSize: '0.9375rem',   /* 15px */
                      color: sub.is_done ? 'var(--text-muted)' : 'var(--text-primary)',
                      textDecoration: sub.is_done ? 'line-through' : 'none',
                      lineHeight: 1.5,
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '9999px', background: 'currentColor', flexShrink: 0 }} />
                    {sub.title}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
