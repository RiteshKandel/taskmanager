'use client'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable'
import { useState, useCallback, useEffect } from 'react'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'
import { useBulkUpdateTasks } from '@/lib/hooks/use-tasks'
import type { Task } from '@/lib/hooks/use-tasks'

const COLUMNS = [
  { id: 'todo',        label: 'To Do',       color: '#64748B' },
  { id: 'in_progress', label: 'In Progress', color: '#4F46E5' },
  { id: 'done',        label: 'Done',        color: '#059669' },
]

interface KanbanBoardProps {
  tasks: Task[]
  projectId: number
  onOpenTask: (task: Task) => void
  canEdit?: boolean
}

export function KanbanBoard({ tasks, projectId, onOpenTask }: KanbanBoardProps) {
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const bulkUpdate = useBulkUpdateTasks(projectId)

  // Keep local state in sync when parent data changes (e.g. after a background refetch).
  useEffect(() => setLocalTasks(tasks), [tasks])

  // PointerSensor requires 8px movement before a drag starts to prevent accidental drags on click.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const tasksByStatus = useCallback((status: string) =>
    localTasks.filter(t => t.status === status && !t.parent)
              .sort((a, b) => a.position - b.position),
  [localTasks])

  function handleDragStart({ active }: any) {
    const task = localTasks.find(t => t.id === active.id)
    setActiveTask(task ?? null)
  }

  function handleDragOver({ active, over }: any) {
    if (!over) return
    const activeId = active.id
    const overId   = over.id
    if (activeId === overId) return

    const isOverColumn = COLUMNS.some(c => c.id === overId)
    const overTask     = localTasks.find(t => t.id === overId)
    const targetStatus = isOverColumn ? overId : overTask?.status

    if (!targetStatus) return

    setLocalTasks(prev =>
      prev.map(t => t.id === activeId ? { ...t, status: targetStatus } : t)
    )
  }

  function handleDragEnd({ active, over }: any) {
    setActiveTask(null)
    if (!over) return

    const activeId = active.id
    const overId   = over.id

    const activeTask   = localTasks.find(t => t.id === activeId)!
    const isOverColumn = COLUMNS.some(c => c.id === overId)
    const overTask     = localTasks.find(t => t.id === overId)
    const targetStatus = isOverColumn ? overId : (overTask?.status ?? activeTask.status)

    const colTasks = localTasks
      .filter(t => t.status === targetStatus && !t.parent)
      .sort((a, b) => a.position - b.position)

    let reordered = colTasks
    if (!isOverColumn && overTask) {
      const oldIdx = colTasks.findIndex(t => t.id === activeId)
      const newIdx = colTasks.findIndex(t => t.id === overId)
      if (oldIdx !== -1 && newIdx !== -1) {
        reordered = arrayMove(colTasks, oldIdx, newIdx)
      }
    }

    const updates = reordered.map((t, i) => ({ id: t.id, status: targetStatus, position: i }))

    if (activeTask.status !== targetStatus) {
      updates.push({ id: activeId, status: targetStatus, position: reordered.length })
    }

    bulkUpdate.mutate(updates)

    setLocalTasks(prev => {
      const map = new Map(updates.map(u => [u.id, u]))
      return prev.map(t => map.has(t.id) ? { ...t, ...map.get(t.id) } : t)
    })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 p-6 h-full overflow-x-auto" style={{ background: 'var(--bg-base)' }}>
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.id}
            column={col}
            tasks={tasksByStatus(col.id)}
            projectId={projectId}
            onOpenTask={onOpenTask}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? <KanbanCard task={activeTask} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  )
}