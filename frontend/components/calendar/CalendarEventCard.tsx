'use client'
import type { CalendarEvent } from '@/lib/calendar-utils'

// RBC passes the event + a few extra props to this component
interface Props {
  event: CalendarEvent
}

export function CalendarEventCard({ event }: Props) {
  const task = event.resource

  return (
    <div className="flex items-start gap-1.5 h-full overflow-hidden"
      style={{ color: event.color }}>

      {/* Priority dot */}
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1"
        style={{ background: event.color }}
      />

      <div className="flex-1 min-w-0">
        {/* Task title */}
        <p className="text-[11px] font-medium leading-tight truncate"
          style={{ color: event.color,
                   textDecoration: task.is_done ? 'line-through' : 'none',
                   opacity: task.is_done ? 0.5 : 1 }}>
          {event.title}
        </p>

        {/* Labels — shown if there's room (week/day view) */}
        {Array.isArray(task.labels) && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-0.5 mt-0.5">
            {task.labels.slice(0, 2).map((l: any) => (
              <span key={l.id}
                className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ background: l.color + '25', color: l.color }}>
                {l.title}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Assignee avatar — top right */}
      {Array.isArray(task.assignees) && task.assignees.length > 0 && (
        <div
          className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0"
          style={{ background: 'rgba(124,106,240,.3)', color: '#a89cf5' }}>
          {(task.assignees[0] as any).name?.[0]?.toUpperCase()}
        </div>
      )}
    </div>
  )
}
