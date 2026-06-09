'use client'
import { useState } from 'react'
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/lib/hooks/use-tasks'
import type { Task } from '@/lib/hooks/use-tasks'

interface Props { task: Task; projectId: number; canEdit: boolean }

export function SubtaskList({ task, projectId, canEdit }: Props) {
  const createTask = useCreateTask(projectId)
  const updateTask = useUpdateTask(projectId)
  const deleteTask = useDeleteTask(projectId)
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding]    = useState(false)

  // Subtasks have parent=task.id, fetched via ?parent=task.id
  const { data: allTasks = [] } = useTasks(projectId)
  const subtasks = allTasks.filter((t: Task) => t.parent === task.id)

  const done  = subtasks.filter((t: Task) => t.is_done).length
  const total = subtasks.length
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    await createTask.mutateAsync({
      title:  newTitle,
      parent: task.id,
      status: 'todo',
    })
    setNewTitle('')
    setAdding(false)
  }

  return (
    <div>
      {/* Progress bar */}
      {total > 0 && (
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden"
            style={{ background:'var(--bg-active)' }}>
            <div className="h-full rounded-full transition-all"
              style={{ width:`${pct}%`, background: pct === 100 ? 'var(--color-green)' : 'var(--accent)' }} />
          </div>
          <span className="text-[10px] font-semibold"
            style={{ color:'var(--text-muted)' }}>{done}/{total}</span>
        </div>
      )}

      {/* Subtask rows */}
      <div className="space-y-0.5">
        {subtasks.map((sub: Task) => (
          <div key={sub.id}
            className="flex items-center gap-2.5 px-2 py-2 rounded-lg group"
            style={{ border:'1px solid transparent' }}
            onMouseEnter={e=>{e.currentTarget.style.background='var(--bg-elevated)';e.currentTarget.style.borderColor='var(--border)'}}
            onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor='transparent'}}>

            <button
              onClick={() => updateTask.mutate({ id: sub.id, is_done: !sub.is_done })}
              disabled={!canEdit}
              className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
              style={{
                background: sub.is_done ? 'var(--color-green)' : 'transparent',
                border:     sub.is_done ? 'none' : '1.5px solid var(--text-muted)',
              }}>
              {sub.is_done && <span className="text-[9px] font-bold" style={{ color:'#0e0f14' }}>✓</span>}
            </button>

            <span className="flex-1 text-xs"
              style={{ color: sub.is_done ? 'var(--text-muted)' : 'var(--text-primary)',
                       textDecoration: sub.is_done ? 'line-through' : 'none' }}>
              {sub.title}
            </span>

            {canEdit && (
              <button onClick={() => deleteTask.mutate(sub.id)}
                className="opacity-0 group-hover:opacity-100 text-[10px] transition-opacity"
                style={{ color:'var(--text-muted)' }}>✕</button>
            )}
          </div>
        ))}
      </div>

      {/* Add subtask */}
      {canEdit && (
        adding ? (
          <form onSubmit={handleAdd} className="flex items-center gap-2 mt-2 pl-2">
            <div className="w-4 h-4 rounded border-1.5 flex-shrink-0"
              style={{ border:'1.5px solid var(--text-muted)' }} />
            <input autoFocus value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onBlur={() => { if (!newTitle) setAdding(false) }}
              placeholder="Subtask title…"
              className="flex-1 text-xs bg-transparent outline-none"
              style={{ color:'var(--text-primary)' }} />
            <button type="submit"
              className="text-[10px] px-2 py-1 rounded-md"
              style={{ background:'var(--accent)', color:'white' }}>Add</button>
          </form>
        ) : (
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-2 mt-2 pl-2 text-xs transition-colors"
            style={{ color:'var(--text-muted)' }}>
            + Add subtask
          </button>
        )
      )}
    </div>
  )
}
