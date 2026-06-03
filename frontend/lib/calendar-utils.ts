import type { Task } from '@/lib/hooks/use-tasks'

// Each event we pass to react-big-calendar
export type CalendarEvent = {
  id:        number
  title:     string
  start:     Date
  end:       Date
  allDay:    boolean
  resource:  Task      // attach the full task for click handlers
  color:     string
  bgColor:   string
}

// Priority → color palette
const PRIORITY_COLORS: Record<number, { color: string; bg: string }> = {
  0: { color: '#8b8fa8', bg: 'rgba(139,143,168,.12)' },   // none — gray
  1: { color: '#60a5fa', bg: 'rgba(96,165,250,.12)'  },   // low — blue
  2: { color: '#fbbf24', bg: 'rgba(251,191,36,.12)'  },   // medium — amber
  3: { color: '#fb923c', bg: 'rgba(251,146,60,.12)'  },   // high — orange
  4: { color: '#f87171', bg: 'rgba(248,113,113,.12)' },   // urgent — red
}

// Check if a date is at midnight (no time component set)
function isMidnight(d: Date): boolean {
  return d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0
}

// Check if two dates are on different calendar days
function isDifferentDay(a: Date, b: Date): boolean {
  return a.toDateString() !== b.toDateString()
}

// Convert a task to a calendar event
export function taskToEvent(task: Task): CalendarEvent | null {
  // Must have at least a due_date or start_date to appear on calendar
  if (!task.due_date && !task.start_date) return null

  const palette = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS[0]

  // Case 1: Both start_date and due_date are set → use as range
  if (task.start_date && task.due_date) {
    const start = new Date(task.start_date)
    const end   = new Date(task.due_date)

    // If both are midnight, treat as multi-day all-day event
    const isAllDay = isMidnight(start) && isMidnight(end)

    // For multi-day all-day events, add 1 day to end so RBC shows it inclusively
    const adjustedEnd = isAllDay && isDifferentDay(start, end)
      ? new Date(end.getTime() + 24 * 60 * 60 * 1000)
      : end

    return {
      id: task.id, title: task.title,
      start, end: adjustedEnd,
      allDay: isAllDay,
      resource: task,
      color: palette.color, bgColor: palette.bg,
    }
  }

  // Case 2: Only due_date → single point event (1-hour default)
  if (task.due_date) {
    const start = new Date(task.due_date)
    const end   = new Date(start)
    end.setHours(end.getHours() + 1)

    const isAllDay = isMidnight(start)

    return {
      id: task.id, title: task.title,
      start, end: isAllDay ? start : end,
      allDay: isAllDay,
      resource: task,
      color: palette.color, bgColor: palette.bg,
    }
  }

  // Case 3: Only start_date → show as a 1-hour event at start time
  if (task.start_date) {
    const start = new Date(task.start_date)
    const end   = new Date(start)
    end.setHours(end.getHours() + 1)

    return {
      id: task.id, title: task.title,
      start, end,
      allDay: isMidnight(start),
      resource: task,
      color: palette.color, bgColor: palette.bg,
    }
  }

  return null
}

// Convert all tasks → filter out ones without dates
export function tasksToEvents(tasks: Task[]): CalendarEvent[] {
  return tasks
    .filter(t => !t.is_done)        // hide completed tasks
    .map(taskToEvent)
    .filter(Boolean) as CalendarEvent[]
}
