'use client'
import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { useCreateTask } from '@/lib/hooks/use-tasks'

interface Props {
  projectId:   number
  defaultStart: Date
  defaultEnd:   Date
  onClose:     () => void
}

const DURATION_OPTIONS = [
  { label: '30 min',  minutes: 30 },
  { label: '1 hr',    minutes: 60 },
  { label: '2 hr',    minutes: 120 },
  { label: '4 hr',    minutes: 240 },
  { label: 'All day', minutes: 0 },   // special: sets allDay
  { label: 'Custom',  minutes: -1 },  // special: uses the slot selection
]

export function CreateTaskModal({ projectId, defaultStart, defaultEnd, onClose }: Props) {
  const createTask = useCreateTask(projectId)
  const [title, setTitle]             = useState('')
  const [priority, setPriority]       = useState(0)
  const [durationIdx, setDurationIdx] = useState(1)  // default: 1 hr
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // If user selected a range on the calendar (not just a click), use Custom
  useEffect(() => {
    const diffMs = defaultEnd.getTime() - defaultStart.getTime()
    const diffMin = diffMs / (1000 * 60)
    if (diffMin > 30) {
      // Find matching duration or use Custom
      const matchIdx = DURATION_OPTIONS.findIndex(d => d.minutes === diffMin)
      setDurationIdx(matchIdx >= 0 ? matchIdx : 5) // 5 = Custom
    }
  }, [defaultStart, defaultEnd])

  useEffect(() => {
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Compute the actual start/end based on selected duration
  const computeDates = () => {
    const opt = DURATION_OPTIONS[durationIdx]

    if (opt.minutes === 0) {
      // All day — set to midnight
      const start = new Date(defaultStart)
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      return { start_date: start.toISOString(), due_date: end.toISOString() }
    }

    if (opt.minutes === -1) {
      // Custom — use exact slot selection from calendar
      return { start_date: defaultStart.toISOString(), due_date: defaultEnd.toISOString() }
    }

    // Fixed duration
    const start = new Date(defaultStart)
    const end = new Date(start)
    end.setMinutes(end.getMinutes() + opt.minutes)
    return { start_date: start.toISOString(), due_date: end.toISOString() }
  }

  // Preview the computed end time
  const previewDates = computeDates()
  const previewEnd = new Date(previewDates.due_date)
  const isAllDay = DURATION_OPTIONS[durationIdx].minutes === 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    setLoading(true)
    try {
      const dates = computeDates()
      await createTask.mutateAsync({
        title:      title.trim(),
        priority,
        start_date: dates.start_date,
        due_date:   dates.due_date,
        status:     'todo',
      })
      onClose()
    } catch {
      setError('Failed to create task')
      setLoading(false)
    }
  }

  const PRIORITIES = [
    { val:0, label:'None',   color:'#4a4e65' },
    { val:1, label:'Low',    color:'#60a5fa' },
    { val:2, label:'Medium', color:'#fbbf24' },
    { val:3, label:'High',   color:'#fb923c' },
    { val:4, label:'Urgent', color:'#f87171' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.6)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>

      <div className="w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-scale-in"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold"
              style={{ color: 'var(--text-primary)' }}>New task</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              📅 {format(defaultStart, 'EEE, MMM d · h:mm a')}
              {!isAllDay && <> → {format(previewEnd, 'h:mm a')}</>}
              {isAllDay && <> · All day</>}
            </p>
          </div>
          <button onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-md text-xs"
            style={{ background: 'var(--bg-active)', color: 'var(--text-muted)' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <input ref={inputRef} value={title}
            onChange={e => { setTitle(e.target.value); setError('') }}
            placeholder="Task title…"
            className="w-full text-sm rounded-lg px-3 py-2.5 outline-none transition-all"
            style={{ background: 'var(--bg-active)', border: '1px solid var(--border)',
                     color: 'var(--text-primary)' }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onBlur={e  => e.currentTarget.style.borderColor = 'var(--border)'}
          />
          {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}

          {/* Duration picker */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--text-muted)' }}>Duration</p>
            <div className="grid grid-cols-3 gap-1.5">
              {DURATION_OPTIONS.map((d, i) => (
                <button key={d.label} type="button"
                  onClick={() => setDurationIdx(i)}
                  className="py-1.5 rounded-md text-[10px] font-medium transition-all"
                  style={{
                    background: durationIdx === i ? 'rgba(124,106,240,.15)' : 'var(--bg-active)',
                    color:      durationIdx === i ? '#a89cf5' : 'var(--text-muted)',
                    border:     `1px solid ${durationIdx === i ? 'rgba(124,106,240,.4)' : 'var(--border)'}`,
                  }}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority picker */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--text-muted)' }}>Priority</p>
            <div className="flex gap-2">
              {PRIORITIES.map(p => (
                <button key={p.val} type="button"
                  onClick={() => setPriority(p.val)}
                  className="flex-1 py-1.5 rounded-md text-[10px] font-medium transition-all"
                  style={{
                    background: priority === p.val ? p.color + '25' : 'var(--bg-active)',
                    color:      priority === p.val ? p.color : 'var(--text-muted)',
                    border:     `1px solid ${priority === p.val ? p.color + '60' : 'var(--border)'}`,
                  }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: 'var(--bg-active)', color: 'var(--text-secondary)' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading || !title.trim()}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
              style={{ background: 'var(--accent)', color: 'white' }}>
              {loading ? 'Creating…' : '+ Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
