'use client'
import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useCreateTask } from '@/lib/hooks/use-tasks'
import { KanbanCard } from './KanbanCard'
import type { Task } from '@/lib/hooks/use-tasks'

interface KanbanColumnProps {
  column: { id: string; label: string; color: string }
  tasks: Task[]
  projectId: number
  onOpenTask: (task: Task) => void
}

export function KanbanColumn({ column, tasks, projectId, onOpenTask }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const taskIds    = tasks.map(t => t.id)
  const [adding, setAdding] = useState(false)
  const [title, setTitle]   = useState('')
  const createTask = useCreateTask(projectId)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    await createTask.mutateAsync({ title, status: column.id })
    setTitle('')
    setAdding(false)
  }

  return (
    <div className="flex flex-col w-80 flex-shrink-0 h-full">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: column.color }}
        />
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {column.label}
        </span>
        <span
          className="ml-auto font-semibold px-2 py-0.5 rounded-full"
          style={{
            fontSize: '0.6875rem',   /* 11px — decorative count */
            background: 'var(--bg-elevated)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
          }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Droppable area */}
      <div
        ref={setNodeRef}
        className="flex-1 flex flex-col gap-1.5 p-2 rounded-[20px] min-h-[200px] transition-colors overflow-y-auto"
        style={{
          background: isOver ? 'var(--accent-dim)' : 'var(--bg-surface)',
          border: `1px solid ${isOver ? 'var(--accent)' : 'var(--border)'}`,
        }}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <KanbanCard key={task.id} task={task} onOpen={onOpenTask} />
          ))}
        </SortableContext>

        {adding ? (
          <form onSubmit={handleAdd} className="mt-1">
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Task name…"
              onBlur={() => { if (!title) setAdding(false) }}
              className="input-base text-sm"
            />
            <div className="flex gap-2 mt-2">
              <button type="submit" className="btn-primary" style={{ padding: '7px 14px', fontSize: '0.875rem' }}>
                Add
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="text-sm px-3 py-1.5 transition-colors rounded-[10px]"
                style={{ color: 'var(--text-muted)' }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-[14px] mt-auto transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--bg-hover)'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-muted)'
            }}
          >
            + Add task
          </button>
        )}
      </div>
    </div>
  )
}