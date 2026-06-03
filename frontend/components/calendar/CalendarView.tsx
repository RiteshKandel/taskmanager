'use client'
import { useState, useCallback, useMemo } from 'react'
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import './calendar.css'

import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'

import { tasksToEvents, CalendarEvent } from '@/lib/calendar-utils'
import { useUpdateTask } from '@/lib/hooks/use-tasks'
import type { Task } from '@/lib/hooks/use-tasks'
import { CalendarToolbar } from './CalendarToolbar'
import { CalendarEventCard } from './CalendarEventCard'
import { CreateTaskModal } from './CreateTaskModal'
import { TaskDetailPanel } from '@/components/tasks/TaskDetailPanel'

// Wrap Calendar with drag-and-drop support
const DnDCalendar = withDragAndDrop(Calendar)

// Create the localizer once — tells RBC how to format dates
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),  // week starts Monday
  getDay,
  locales: { 'en-US': enUS },
})

interface CalendarViewProps {
  tasks:     Task[]
  projectId: number
  canEdit:   boolean
}

export function CalendarView({ tasks, projectId, canEdit }: CalendarViewProps) {
  // Which calendar view is active
  const [currentView, setCurrentView] = useState<string>(Views.WEEK)
  const [currentDate, setCurrentDate] = useState(new Date())

  // Modal state for creating a task by clicking a slot
  const [slotInfo, setSlotInfo] = useState<{ start: Date; end: Date } | null>(null)

  // Task detail panel — clicking an existing event
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const updateTask = useUpdateTask(projectId)

  // Convert tasks → RBC events (memoized so it only recalculates when tasks change)
  const events = useMemo(() => tasksToEvents(tasks), [tasks])

  // ── Event handlers ─────────────────────────────────────────

  // Click an empty time slot → open create modal
  const handleSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => {
    if (!canEdit) return
    setSlotInfo({ start, end })
  }, [canEdit])

  // Click an existing event → open task detail
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedTask(event.resource)
  }, [])

  // Drag event to a new date → shift both start_date and due_date
  const handleEventDrop = useCallback(({ event, start, end }: { event: CalendarEvent; start: Date; end: Date }) => {
    if (!canEdit) return
    updateTask.mutate({
      id:         event.id,
      start_date: start.toISOString(),
      due_date:   end.toISOString(),
    })
  }, [canEdit, updateTask])

  // Resize event → update start_date or due_date depending on which edge was dragged
  // Enforce minimum 1-hour duration
  const MIN_DURATION_MS = 60 * 60 * 1000   // 1 hour in milliseconds
  const handleEventResize = useCallback(({ event, start, end }: { event: CalendarEvent; start: Date; end: Date }) => {
    if (!canEdit) return
    const clampedEnd = (end.getTime() - start.getTime()) < MIN_DURATION_MS
      ? new Date(start.getTime() + MIN_DURATION_MS)   // snap up to 1 hr minimum
      : end
    updateTask.mutate({
      id:         event.id,
      start_date: start.toISOString(),
      due_date:   clampedEnd.toISOString(),
    })
  }, [canEdit, updateTask])

  // Custom event style — use the task's priority color
  const eventStyleGetter = useCallback((event: CalendarEvent) => ({
    style: {
      background:    event.allDay
        ? event.bgColor.replace(/[\d.]+\)$/, '0.35)')   // more opaque for all-day chips
        : event.bgColor,
      borderTop:     'none',
      borderRight:   'none',
      borderBottom:  'none',
      borderLeft:    `${event.allDay ? 3 : 2}px solid ${event.color}`,
      borderRadius:  '6px',
      color:         event.color,
      padding:       '2px 6px',
      fontSize:      event.allDay ? '12px' : '11px',
      fontWeight:    (event.allDay ? '600' : '500') as '600' | '500',
      cursor:        canEdit ? 'grab' : 'pointer',
    },
  }), [canEdit])

  // Custom day prop — highlight today
  const dayPropGetter = useCallback((date: Date) => {
    const isToday = date.toDateString() === new Date().toDateString()
    return isToday ? { style: { background: 'rgba(124,106,240,.04)' } } : {}
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Custom toolbar — month/week/day navigation */}
      <CalendarToolbar
        date={currentDate}
        view={currentView}
        onNavigate={setCurrentDate}
        onView={setCurrentView}
      />

      {/* The calendar itself */}
      <div className="flex-1 overflow-hidden" style={{ padding: '0 12px 12px' }}>
        <DnDCalendar
          localizer={localizer}
          events={events}
          date={currentDate}
          view={currentView as any}
          onNavigate={setCurrentDate}
          onView={setCurrentView as any}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent as any}
          onEventDrop={handleEventDrop as any}
          onEventResize={handleEventResize as any}
          eventPropGetter={eventStyleGetter as any}
          dayPropGetter={dayPropGetter}
          selectable={canEdit}              // disable slot select for viewers
          resizable={canEdit}
          step={60}                         // 1-hour snap granularity
          timeslots={2}                     // 2 slots per label → labels every 2 hours
          defaultView={Views.WEEK}
          views={[Views.MONTH, Views.WEEK, Views.DAY]}
          scrollToTime={new Date(1970, 1, 1, 8)}   // scroll to 8 AM on load
          components={{
            event: CalendarEventCard as any,   // our custom event card
          }}
          style={{ height: '100%' }}
        />
      </div>

      {/* Create task modal — shown when slot is clicked */}
      {slotInfo && (
        <CreateTaskModal
          projectId={projectId}
          defaultStart={slotInfo.start}
          defaultEnd={slotInfo.end}
          onClose={() => setSlotInfo(null)}
        />
      )}

      {/* Task detail panel — shown when event is clicked */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          projectId={projectId}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  )
}
