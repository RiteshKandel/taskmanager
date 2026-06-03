'use client'
import { useState } from 'react'
import { format, addHours, addDays } from 'date-fns'
import { useReminder, useSetReminder, useDeleteReminder } from '@/lib/hooks/use-reminder'

function getPresets() {
  const now = new Date()
  return [
    { label: 'In 1 hour',    value: addHours(now, 1).toISOString() },
    { label: 'In 3 hours',   value: addHours(now, 3).toISOString() },
    { label: 'Tomorrow 9am', value: (() => { const d = addDays(now, 1); d.setHours(9, 0, 0, 0); return d.toISOString() })() },
    { label: 'In 2 days',    value: addDays(now, 2).toISOString() },
  ]
}

interface Props { taskId: number; canEdit: boolean }

export function ReminderPicker({ taskId, canEdit }: Props) {
  const { data: reminder }     = useReminder(taskId)
  const setReminder            = useSetReminder(taskId)
  const deleteReminder         = useDeleteReminder(taskId)
  const [showPicker, setShow]  = useState(false)
  const [customTime, setCustom] = useState('')

  const btnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? 'rgba(124,106,240,.15)' : 'var(--bg-elevated)',
    color:      active ? '#a89cf5' : 'var(--text-secondary)',
    border:     `1px solid ${active ? 'rgba(124,106,240,.4)' : 'var(--border)'}`,
    borderRadius: '8px',
    padding: '6px 10px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all .15s',
  })

  return (
    <div>
      {/* Current reminder display */}
      {reminder ? (
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-md font-medium"
            style={{
              background: reminder.sent ? 'var(--bg-active)' : 'rgba(124,106,240,.12)',
              color: reminder.sent ? 'var(--text-muted)' : '#a89cf5',
            }}>
            ⏰ {format(new Date(reminder.reminder_time), 'MMM d · h:mm a')}
            {reminder.sent && ' · sent'}
          </span>
          {canEdit && !reminder.sent && (
            <button
              onClick={() => deleteReminder.mutate()}
              className="text-xs transition-colors"
              style={{ color: 'var(--text-muted)' }}
              title="Remove reminder">
              ✕
            </button>
          )}
        </div>
      ) : canEdit ? (
        <button
          onClick={() => setShow(p => !p)}
          className="text-xs flex items-center gap-1.5 transition-colors"
          style={{ color: showPicker ? '#a89cf5' : 'var(--text-muted)' }}>
          ⏰ {showPicker ? 'Close' : 'Set reminder'}
        </button>
      ) : (
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No reminder</span>
      )}

      {/* Picker panel */}
      {showPicker && (
        <div className="mt-2 p-3 rounded-xl space-y-3"
          style={{ background: 'var(--bg-active)', border: '1px solid var(--border)' }}>

          <p className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}>Quick set</p>

          <div className="grid grid-cols-2 gap-1.5">
            {getPresets().map(p => (
              <button key={p.label}
                onClick={() => { setReminder.mutate(p.value); setShow(false) }}
                style={btnStyle(false)}
                className="text-left">
                {p.label}
              </button>
            ))}
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--text-muted)' }}>Custom time</p>
            <div className="flex gap-2">
              <input type="datetime-local" value={customTime}
                onChange={e => setCustom(e.target.value)}
                className="flex-1 text-xs rounded-lg px-2.5 py-1.5 outline-none"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                         color: 'var(--text-primary)' }} />
              <button
                onClick={() => { if (customTime) { setReminder.mutate(new Date(customTime).toISOString()); setShow(false); setCustom('') }}}
                disabled={!customTime}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold disabled:opacity-40 transition-all"
                style={{ background: 'var(--accent)', color: 'white' }}>
                Set
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
