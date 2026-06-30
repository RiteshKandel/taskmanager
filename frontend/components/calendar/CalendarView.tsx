'use client'
import { useState, useCallback, useMemo } from 'react'
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import './calendar.css'

import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, useDroppable, useDraggable,
} from '@dnd-kit/core'

import { format, parse, startOfWeek, getDay, addDays, isSameDay } from 'date-fns'
import { startOfWeek as soW } from 'date-fns'
import { enUS } from 'date-fns/locale'

import { tasksToEvents, CalendarEvent } from '@/lib/calendar-utils'
import { useUpdateTask } from '@/lib/hooks/use-tasks'
import { useIsMobile } from '@/lib/hooks/use-media-query'
import type { Task } from '@/lib/hooks/use-tasks'
import { CalendarToolbar } from './CalendarToolbar'
import { CalendarEventCard } from './CalendarEventCard'
import { CreateTaskModal } from './CreateTaskModal'
import { TaskDetailPanel } from '@/components/tasks/TaskDetailPanel'

const DnDCalendar = withDragAndDrop(Calendar)

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { 'en-US': enUS },
})

// ── Priority palette ─────────────────────────────────────────────────────────
const PRIORITY_COLORS: Record<number, { color: string; bg: string; label: string; emoji: string }> = {
  0: { color: '#6b7099', bg: 'rgba(107,112,153,.13)', label: 'None',   emoji: '' },
  1: { color: '#60a5fa', bg: 'rgba(96,165,250,.13)',  label: 'Low',    emoji: '🔵' },
  2: { color: '#fbbf24', bg: 'rgba(251,191,36,.13)',  label: 'Medium', emoji: '🟡' },
  3: { color: '#fb923c', bg: 'rgba(251,146,60,.13)',  label: 'High',   emoji: '🟠' },
  4: { color: '#f87171', bg: 'rgba(248,113,113,.13)', label: 'Urgent', emoji: '🔴' },
}

interface CalendarViewProps {
  tasks:     Task[]
  projectId: number
  canEdit:   boolean
}

// ── Get tasks that fall on a specific date ───────────────────────────────────
function getTasksForDay(tasks: Task[], date: Date): Task[] {
  return tasks.filter(t => {
    const d = t.due_date ? new Date(t.due_date) : t.start_date ? new Date(t.start_date) : null
    return d && isSameDay(d, date)
  })
}

// ── Draggable task card ──────────────────────────────────────────────────────
function DraggableTaskCard({
  task, onTaskClick, canEdit, compact = false,
}: { task: Task; onTaskClick: (t: Task) => void; canEdit: boolean; compact?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { task },
    disabled: !canEdit,
  })
  const pal = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS[0]

  return (
    <div ref={setNodeRef} {...attributes} {...listeners}
      style={{ opacity: isDragging ? 0.25 : 1, touchAction: 'none' }}>
      <button onClick={() => onTaskClick(task)}
        className="w-full text-left rounded-lg px-2.5 py-2 transition-all"
        style={{ background: pal.bg, borderLeft: `3px solid ${pal.color}`, opacity: task.is_done ? 0.6 : 1 }}>
        <p className="text-[11px] font-medium leading-snug"
          style={{ color: pal.color, textDecoration: task.is_done ? 'line-through' : 'none' }}>
          {task.title}
        </p>
        {!compact && (
          <div className="flex flex-wrap gap-1 mt-1">
            {task.priority > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                style={{ background: pal.color + '22', color: pal.color }}>
                {pal.label}
              </span>
            )}
            {Array.isArray(task.labels) && (task.labels as any[]).slice(0, 2).map((l: any) => (
              <span key={l.id} className="text-[9px] px-1.5 py-0.5 rounded-full"
                style={{ background: l.color + '22', color: l.color }}>{l.title}</span>
            ))}
            {task.is_done && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(52,211,153,.15)', color: '#34d399' }}>✓ Done</span>
            )}
          </div>
        )}
      </button>
    </div>
  )
}

// ── Droppable day column (week view) ─────────────────────────────────────────
function DroppableDayColumn({
  date, tasks, onTaskClick, onAddClick, canEdit,
}: { date: Date; tasks: Task[]; onTaskClick: (t: Task) => void; onAddClick: (d: Date) => void; canEdit: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-${date.toDateString()}`, data: { date } })
  const isToday = isSameDay(date, new Date())

  return (
    <div ref={setNodeRef} className="flex flex-col h-full overflow-hidden transition-colors"
      style={{
        background: isOver ? 'rgba(124,106,240,.1)' : isToday ? 'rgba(124,106,240,.03)' : 'transparent',
      }}>
      {/* Day header — fixed height so all columns align */}
      <div className="flex-shrink-0 py-2 px-2 text-center"
        style={{ borderBottom: '1px solid var(--border)', minHeight: '68px' }}>
        <p className="text-[9px] font-bold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}>{format(date, 'EEE')}</p>
        <div className="w-7 h-7 flex items-center justify-center rounded-full mx-auto mt-0.5 text-sm font-bold"
          style={{ background: isToday ? 'var(--accent)' : 'transparent',
                   color: isToday ? 'white' : 'var(--text-primary)' }}>
          {format(date, 'd')}
        </div>
        {/* Always render this line — keeps header height consistent across all columns */}
        <p className="text-[9px] mt-0.5 h-3 leading-3"
          style={{ color: 'var(--text-muted)', visibility: tasks.length > 0 ? 'visible' : 'hidden' }}>
          {tasks.filter(t => !t.is_done).length} left
        </p>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
        {isOver && (
          <div className="rounded-lg border-2 border-dashed py-2 text-center text-[10px]"
            style={{ borderColor: 'var(--accent)', color: '#a89cf5' }}>
            Drop here
          </div>
        )}
        {tasks.map(t => (
          <DraggableTaskCard key={t.id} task={t} onTaskClick={onTaskClick} canEdit={canEdit} compact />
        ))}
        {tasks.length === 0 && !isOver && (
          <p className="text-[9px] px-1 pt-1" style={{ color: 'var(--text-muted)' }}>empty</p>
        )}
      </div>

      {/* Add button */}
      {canEdit && (
        <button onClick={() => onAddClick(date)}
          className="flex-shrink-0 py-1.5 text-[10px] font-medium transition-all border-t"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-active)'; e.currentTarget.style.color = '#a89cf5' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}>
          + Add
        </button>
      )}
    </div>
  )
}

// ── Rich Day view ────────────────────────────────────────────────────────────
function CustomDayView({
  date, tasks, onTaskClick, onAddClick, canEdit,
}: { date: Date; tasks: Task[]; onTaskClick: (t: Task) => void; onAddClick: (d: Date) => void; canEdit: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-${date.toDateString()}`, data: { date } })
  const dayTasks  = getTasksForDay(tasks, date)
  const done      = dayTasks.filter(t => t.is_done).length
  const pending   = dayTasks.filter(t => !t.is_done)
  const pct       = dayTasks.length > 0 ? Math.round((done / dayTasks.length) * 100) : 0
  const isToday   = isSameDay(date, new Date())

  const urgent    = pending.filter(t => t.priority >= 3)
  const medium    = pending.filter(t => t.priority === 2)
  const low       = pending.filter(t => t.priority <= 1)
  const completed = dayTasks.filter(t => t.is_done)

  const section = (icon: string, label: string, color: string, borderColor: string, items: Task[]) => (
    <div>
      <div className="flex items-center gap-2 mb-2.5">
        <span>{icon}</span>
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{label}</p>
        <div className="flex-1 h-px" style={{ background: borderColor }} />
        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
          style={{ background: borderColor, color }}>{items.length}</span>
      </div>
      <div className="space-y-2">
        {items.map(t => (
          <DraggableTaskCard key={t.id} task={t} onTaskClick={onTaskClick} canEdit={canEdit} />
        ))}
      </div>
    </div>
  )

  return (
    <div ref={setNodeRef} className="h-full overflow-y-auto transition-colors"
      style={{ background: isOver ? 'rgba(124,106,240,.04)' : 'transparent' }}>
      {/* Hero header */}
      <div className="px-8 pt-8 pb-6"
        style={{ background: 'linear-gradient(180deg,rgba(124,106,240,.06) 0%,transparent 100%)' }}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1"
              style={{ color: '#7c6af0' }}>{isToday ? '📍 Today' : format(date, 'EEEE')}</p>
            <h2 className="text-4xl font-bold leading-none" style={{ color: 'var(--text-primary)' }}>
              {format(date, 'MMMM d')}
            </h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {format(date, 'EEEE · yyyy')}
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex gap-5 pt-1">
            {[
              { val: dayTasks.length, label: 'Total',     color: 'var(--text-primary)' },
              { val: pending.length,  label: 'Remaining', color: '#60a5fa' },
              { val: done,            label: 'Done',       color: '#34d399' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold leading-none" style={{ color: s.color }}>{s.val}</p>
                <p className="text-[9px] mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        {dayTasks.length > 0 && (
          <div>
            <div className="flex justify-between mb-1.5">
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Daily progress</p>
              <p className="text-[10px] font-bold"
                style={{ color: pct === 100 ? '#34d399' : '#a89cf5' }}>{pct}%</p>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-active)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: pct === 100
                    ? 'linear-gradient(90deg,#34d399,#6ee7b7)'
                    : 'linear-gradient(90deg,#7c6af0,#a89cf5)',
                }} />
            </div>
          </div>
        )}
      </div>

      {/* Task sections */}
      <div className="px-8 pb-8">
        {dayTasks.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
              style={{ background: 'rgba(124,106,240,.08)', border: '1px solid rgba(124,106,240,.15)' }}>
              <span style={{ fontSize: '40px' }}>📅</span>
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              {isToday ? 'Nothing scheduled today' : 'No tasks for this day'}
            </p>
            <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
              {canEdit ? 'Drag a task here or click below to add one' : 'Nothing to show'}
            </p>
            {canEdit && (
              <button onClick={() => onAddClick(date)}
                className="px-5 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{ background: 'var(--accent)', color: 'white' }}>
                + Add a task for {format(date, 'MMM d')}
              </button>
            )}
            {isOver && (
              <div className="mt-4 px-6 py-3 rounded-xl border-2 border-dashed"
                style={{ borderColor: 'var(--accent)', color: '#a89cf5' }}>
                Drop task here to schedule it
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-7">
            {urgent.length > 0  && section('🔥', 'High Priority', '#f87171', 'rgba(248,113,113,.2)', urgent)}
            {medium.length > 0  && section('⚡', 'Medium',        '#fbbf24', 'rgba(251,191,36,.2)',  medium)}
            {low.length > 0     && section('📋', 'Tasks',         'var(--text-muted)', 'var(--border)', low)}
            {completed.length > 0 && section('✅', 'Completed',   '#34d399', 'rgba(52,211,153,.2)',  completed)}

            {canEdit && (
              <button onClick={() => onAddClick(date)}
                className="group w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 mt-6"
                style={{
                  background: 'linear-gradient(135deg, rgba(124,106,240,.08) 0%, rgba(124,106,240,.03) 100%)',
                  border: '1.5px solid rgba(124,106,240,.2)',
                  color: 'var(--text-muted)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124,106,240,.18) 0%, rgba(124,106,240,.08) 100%)'
                  e.currentTarget.style.borderColor = 'rgba(124,106,240,.45)'
                  e.currentTarget.style.color = '#a89cf5'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,106,240,.15)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124,106,240,.08) 0%, rgba(124,106,240,.03) 100%)'
                  e.currentTarget.style.borderColor = 'rgba(124,106,240,.2)'
                  e.currentTarget.style.color = 'var(--text-muted)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}>
                <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold transition-colors"
                  style={{ background: 'rgba(124,106,240,.15)', color: '#a89cf5' }}>+</span>
                Add task for {format(date, 'MMMM d')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Custom Week view (7 droppable columns) ───────────────────────────────────
function CustomWeekView({
  date, tasks, onTaskClick, onAddClick, canEdit,
}: { date: Date; tasks: Task[]; onTaskClick: (t: Task) => void; onAddClick: (d: Date) => void; canEdit: boolean }) {
  const weekStart = soW(date, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="flex h-full overflow-hidden" style={{ minHeight: 0 }}>
      {days.map((d, i) => {
        const dayTasks = getTasksForDay(tasks, d)
        return (
          <div key={i} className="flex-1 flex flex-col overflow-hidden"
            style={{ borderLeft: i > 0 ? '1px solid var(--border)' : 'none' }}>
            <DroppableDayColumn
              date={d} tasks={dayTasks}
              onTaskClick={onTaskClick} onAddClick={onAddClick} canEdit={canEdit}
            />
          </div>
        )
      })}
    </div>
  )
}

// ── Main CalendarView ────────────────────────────────────────────────────────
export function CalendarView({ tasks, projectId, canEdit }: CalendarViewProps) {
  const isMobile = useIsMobile()
  const [currentView, setCurrentView] = useState<string>(
    isMobile ? Views.DAY : Views.WEEK
  )
  const [currentDate, setCurrentDate] = useState(new Date())
  const [slotInfo, setSlotInfo]       = useState<{ start: Date; end: Date } | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [activeTask, setActiveTask]   = useState<Task | null>(null)

  const updateTask = useUpdateTask(projectId)
  const events     = useMemo(() => tasksToEvents(tasks), [tasks])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  // ── dnd-kit drag handlers ──────────────────────────────────
  const handleDragStart = (e: DragStartEvent) => {
    const t = (e.active.data.current as any)?.task as Task | undefined
    if (t) setActiveTask(t)
  }

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveTask(null)
    const task = (e.active.data.current as any)?.task as Task | undefined
    const date = (e.over?.data.current as any)?.date as Date | undefined
    if (!task || !date) return

    const orig = task.due_date ? new Date(task.due_date) : null
    if (orig && isSameDay(orig, date)) return  // no-op

    const newDue = new Date(date)
    if (orig) newDue.setHours(orig.getHours(), orig.getMinutes(), 0, 0)

    updateTask.mutate({ id: task.id, due_date: newDue.toISOString() })
  }

  // ── RBC month-view handlers ────────────────────────────────
  const handleSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => {
    if (!canEdit) return
    setSlotInfo({ start, end })
  }, [canEdit])

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedTask(event.resource)
  }, [])

  const handleEventDrop = useCallback(({ event, start, end }: { event: CalendarEvent; start: Date; end: Date }) => {
    if (!canEdit) return
    updateTask.mutate({ id: event.id, start_date: start.toISOString(), due_date: end.toISOString() })
  }, [canEdit, updateTask])

  const MIN_MS = 60 * 60 * 1000
  const handleEventResize = useCallback(({ event, start, end }: { event: CalendarEvent; start: Date; end: Date }) => {
    if (!canEdit) return
    const clampedEnd = (end.getTime() - start.getTime()) < MIN_MS
      ? new Date(start.getTime() + MIN_MS) : end
    updateTask.mutate({ id: event.id, start_date: start.toISOString(), due_date: clampedEnd.toISOString() })
  }, [canEdit, updateTask])

  const eventStyleGetter = useCallback((event: CalendarEvent) => ({
    style: {
      background:   event.bgColor.replace(/[\d.]+\)$/, '0.35)'),
      borderTop:    'none', borderRight: 'none', borderBottom: 'none',
      borderLeft:   `3px solid ${event.color}`,
      borderRadius: '6px', color: event.color,
      padding: '2px 6px', fontSize: '12px', fontWeight: '600' as const,
      cursor: canEdit ? 'grab' : 'pointer',
    },
  }), [canEdit])

  const dayPropGetter = useCallback((date: Date) => {
    const isToday = isSameDay(date, new Date())
    return isToday ? { style: { background: 'rgba(124,106,240,.04)' } } : {}
  }, [])

  // Open create modal pre-filled with the clicked day
  const handleAddClick = (date: Date) =>
    setSlotInfo({ start: date, end: new Date(date.getTime() + 60 * 60 * 1000) })

  const activePal = activeTask ? (PRIORITY_COLORS[activeTask.priority] || PRIORITY_COLORS[0]) : null

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full">
        <CalendarToolbar
          date={currentDate} view={currentView}
          onNavigate={setCurrentDate} onView={setCurrentView}
          availableViews={isMobile ? [Views.DAY, Views.MONTH] : [Views.MONTH, Views.WEEK, Views.DAY]}
        />

        <div className="flex-1 overflow-hidden" style={{ padding: '0 12px 12px', minHeight: 0 }}>

          {/* Month view — react-big-calendar with full drag-and-drop + slot create */}
          {currentView === Views.MONTH && (
            <DnDCalendar
              localizer={localizer} events={events}
              date={currentDate} view={currentView as any}
              onNavigate={setCurrentDate} onView={setCurrentView as any}
              onSelectSlot={handleSelectSlot} onSelectEvent={handleSelectEvent as any}
              onEventDrop={handleEventDrop as any} onEventResize={handleEventResize as any}
              eventPropGetter={eventStyleGetter as any} dayPropGetter={dayPropGetter}
              selectable={canEdit} resizable={canEdit} views={[Views.MONTH]}
              components={{ event: CalendarEventCard as any }} style={{ height: '100%' }}
            />
          )}

          {/* Week view — custom 7-column droppable grid */}
          {currentView === Views.WEEK && (
            <div className="h-full rounded-xl overflow-hidden"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
              <CustomWeekView date={currentDate} tasks={tasks}
                onTaskClick={setSelectedTask} onAddClick={handleAddClick} canEdit={canEdit} />
            </div>
          )}

          {/* Day view — rich daily planner */}
          {currentView === Views.DAY && (
            <div className="h-full rounded-xl overflow-hidden"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
              <CustomDayView date={currentDate} tasks={tasks}
                onTaskClick={setSelectedTask} onAddClick={handleAddClick} canEdit={canEdit} />
            </div>
          )}
        </div>

        {/* Drag overlay — ghost card while dragging */}
        <DragOverlay dropAnimation={null}>
          {activeTask && activePal && (
            <div className="rounded-lg px-3 py-2 shadow-2xl pointer-events-none"
              style={{ background: activePal.bg, borderLeft: `3px solid ${activePal.color}`,
                       minWidth: '130px', cursor: 'grabbing', opacity: 0.9 }}>
              <p className="text-[11px] font-semibold" style={{ color: activePal.color }}>
                {activeTask.title}
              </p>
            </div>
          )}
        </DragOverlay>

        {/* Create task modal (triggered by slot click OR "Add" button) */}
        {slotInfo && (
          <CreateTaskModal projectId={projectId}
            defaultStart={slotInfo.start} defaultEnd={slotInfo.end}
            onClose={() => setSlotInfo(null)} />
        )}

        {/* Task detail panel */}
        {selectedTask && (
          <TaskDetailPanel task={selectedTask} projectId={projectId}
            onClose={() => setSelectedTask(null)} />
        )}
      </div>
    </DndContext>
  )
}
