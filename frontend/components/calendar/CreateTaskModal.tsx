'use client'
import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { useCreateTask } from '@/lib/hooks/use-tasks'
import api from '@/lib/api'

interface Props {
  projectId:    number
  defaultStart: Date
  defaultEnd:   Date
  onClose:      () => void
}

const PRIORITIES = [
  { val: 0, label: 'None',   color: '#4a4e65' },
  { val: 1, label: 'Low',    color: '#60a5fa' },
  { val: 2, label: 'Medium', color: '#fbbf24' },
  { val: 3, label: 'High',   color: '#fb923c' },
  { val: 4, label: 'Urgent', color: '#f87171' },
]

export function CreateTaskModal({ projectId, defaultStart, defaultEnd, onClose }: Props) {
  const createTask = useCreateTask(projectId)

  const [title, setTitle]           = useState('')
  const [priority, setPriority]     = useState(0)
  const [description, setDesc]      = useState('')
  const [reminder, setReminder]     = useState('')   // ISO datetime-local string
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    setLoading(true)
    try {
      // Create task with due_date set to midnight of the selected day (all-day)
      const due = new Date(defaultStart)
      due.setHours(0, 0, 0, 0)

      const created = await createTask.mutateAsync({
        title:       title.trim(),
        priority,
        due_date:    due.toISOString(),
        description: description.trim() || undefined,
        status:      'todo',
      } as any)

      // If a reminder was set, POST to the dedicated reminder endpoint
      if (reminder && created?.id) {
        try {
          await api.post(`/tasks/${created.id}/reminder/`, {
            reminder_time: new Date(reminder).toISOString(),
          })
        } catch {
          // Non-fatal: task was created, reminder just didn't save
          console.warn('Reminder could not be saved')
        }
      }

      onClose()
    } catch {
      setError('Failed to create task')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.6)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>

      <div className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)' }}>

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="px-6 pt-5 pb-4"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>New task</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                📅 {format(defaultStart, 'EEE, MMM d · yyyy')}
              </p>
            </div>
            <button onClick={onClose}
              className="w-6 h-6 flex items-center justify-center rounded-md text-xs mt-0.5"
              style={{ background: 'var(--bg-active)', color: 'var(--text-muted)' }}>✕</button>
          </div>
        </div>

        {/* ── Form ───────────────────────────────────────────── */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">

            {/* Title */}
            <input ref={inputRef} value={title}
              onChange={e => { setTitle(e.target.value); setError('') }}
              placeholder="Task title…"
              className="w-full text-sm rounded-xl px-3 py-2.5 outline-none transition-all"
              style={{ background: 'var(--bg-active)', border: '1px solid var(--border)',
                       color: 'var(--text-primary)' }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onBlur={e  => e.currentTarget.style.borderColor = 'var(--border)'}
            />
            {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}

            {/* Priority */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                style={{ color: 'var(--text-muted)' }}>Priority</p>
              <div className="flex gap-1.5">
                {PRIORITIES.map(p => (
                  <button key={p.val} type="button"
                    onClick={() => setPriority(p.val)}
                    className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                    style={{
                      background: priority === p.val ? p.color + '22' : 'var(--bg-active)',
                      color:      priority === p.val ? p.color         : 'var(--text-muted)',
                      border:     `1px solid ${priority === p.val ? p.color + '55' : 'var(--border)'}`,
                    }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reminder */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                style={{ color: 'var(--text-muted)' }}>🔔 Reminder</p>
              <input
                type="datetime-local"
                value={reminder}
                onChange={e => setReminder(e.target.value)}
                className="w-full text-xs rounded-xl px-3 py-2.5 outline-none transition-all"
                style={{
                  background: 'var(--bg-active)',
                  border: `1px solid ${reminder ? 'rgba(124,106,240,.5)' : 'var(--border)'}`,
                  color: reminder ? '#a89cf5' : 'var(--text-muted)',
                  colorScheme: 'dark',
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onBlur={e  => e.currentTarget.style.borderColor = reminder ? 'rgba(124,106,240,.5)' : 'var(--border)'}
              />
              {reminder && (
                <button type="button" onClick={() => setReminder('')}
                  className="mt-1 text-[10px] transition-colors"
                  style={{ color: 'var(--text-muted)' }}>
                  ✕ Clear reminder
                </button>
              )}
            </div>

            {/* Description */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                style={{ color: 'var(--text-muted)' }}>Description</p>
              <textarea
                value={description}
                onChange={e => setDesc(e.target.value)}
                placeholder="Add details, notes, or context…"
                rows={3}
                className="w-full text-xs rounded-xl px-3 py-2.5 outline-none resize-none transition-all"
                style={{ background: 'var(--bg-active)', border: '1px solid var(--border)',
                         color: 'var(--text-primary)' }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onBlur={e  => e.currentTarget.style.borderColor = 'var(--border)'}
              />
            </div>

          </div>

          {/* ── Actions ─────────────────────────────────────── */}
          <div className="flex gap-2 px-6 py-4"
            style={{ borderTop: '1px solid var(--border)' }}>
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{ background: 'var(--bg-active)', color: 'var(--text-secondary)' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading || !title.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
              style={{ background: 'var(--accent)', color: 'white' }}>
              {loading ? 'Creating…' : '+ Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
