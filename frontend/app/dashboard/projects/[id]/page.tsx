'use client'
import { useState, useRef, Suspense, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { useProject } from '@/lib/hooks/use-projects'
import type { Task } from '@/lib/hooks/use-tasks'
import { useTasks, useCreateTask, useUpdateTask } from '@/lib/hooks/use-tasks'
import { usePermissions, useMembers } from '@/lib/hooks/use-members'
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts'
import { useIsMobile } from '@/lib/hooks/use-media-query'
import { ProjectTopbar } from '@/components/projects/ProjectTopbar'
import { TaskRow } from '@/components/tasks/TaskRow'
import { TaskDetailPanel } from '@/components/tasks/TaskDetailPanel'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { BottomNav } from '@/components/layout/BottomNav'
import { TaskListSkeleton, KanbanSkeleton, TopbarSkeleton } from '@/components/tasks/TaskListSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { ErrorState } from '@/components/ui/ErrorState'

// Load CalendarView only in the browser — avoids "window is not defined" errors
const CalendarView = dynamic(
  () => import('@/components/calendar/CalendarView').then(m => m.CalendarView),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full"
        style={{ color: 'var(--text-muted)' }}>
        Loading calendar…
      </div>
    ),
  }
)

// useSearchParams() requires a Suspense boundary in Next.js App Router.
export default function ProjectPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8" style={{ color: 'var(--text-muted)' }}>Loading…</div>
      }
    >
      <ProjectPageContent />
    </Suspense>
  )
}

function ProjectPageContent() {
  const { id }    = useParams()
  const projectId = Number(id)
  const searchParams = useSearchParams()
  const { data: project }                          = useProject(projectId)
  const { data: tasks, isLoading, isError, refetch } = useTasks(projectId)
  const { canEdit, canManage, role }               = usePermissions(projectId)
  const { data: members = [] }                     = useMembers(projectId)
  const memberCount = Array.isArray(members) ? members.length : 0
  const createTask = useCreateTask(projectId)
  const updateTask = useUpdateTask(projectId)
  const isMobile   = useIsMobile()

  // Fall back to the project's saved default_view, then 'list'
  const view = (searchParams.get('view') || project?.default_view || 'list') as 'list' | 'kanban' | 'calendar' | 'forum'

  const router                        = useRouter()
  const qc                            = useQueryClient()
  const [newTitle, setNewTitle]       = useState('')
  const [selectedTask, setSelected]   = useState<Task | null>(null)
  const [showMoreSheet, setShowMoreSheet] = useState(false)
  const inputRef                      = useRef<HTMLInputElement>(null)

  // Open task panel if ?task=<id> is in the URL (set by CommandPalette)
  useEffect(() => {
    const taskId = searchParams.get('task')
    if (taskId && tasks) {
      const found = tasks.find((t: Task) => t.id === Number(taskId))
      if (found) setSelected(found)
    }
  }, [searchParams, tasks])

  // Project-level keyboard shortcuts
  useKeyboardShortcuts({
    'n':      () => { if (canEdit) inputRef.current?.focus() },
    '1':      () => router.push(`/dashboard/projects/${projectId}?view=list`),
    '2':      () => router.push(`/dashboard/projects/${projectId}?view=kanban`),
    '3':      () => router.push(`/dashboard/projects/${projectId}?view=calendar`),
    'escape': () => setSelected(null),
  })

  const handleAddTask = async () => {
    if (!newTitle.trim()) return
    await createTask.mutateAsync({ title: newTitle })
    setNewTitle('')
  }

  const toggleDone = (task: Task) =>
    updateTask.mutate({ id: task.id, is_done: !task.is_done })

  if (isLoading)
    return (
      <div className="h-full flex flex-col" style={{ background: 'var(--bg-base)' }}>
        <TopbarSkeleton />
        {view === 'kanban' ? <KanbanSkeleton /> : <TaskListSkeleton />}
      </div>
    )

  if (isError)
    return (
      <div className="h-full flex flex-col" style={{ background: 'var(--bg-base)' }}>
        <TopbarSkeleton />
        <ErrorState onRetry={() => refetch()} />
      </div>
    )

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg-base)' }}>
      <ProjectTopbar
        project={project}
        role={role}
        memberCount={memberCount}
        projectId={projectId}
      />

      <div className="flex-1 overflow-hidden">
        <ErrorBoundary onReset={() => qc.invalidateQueries()}>
          {view === 'list' && (
            <ListContent
              tasks={tasks}
              canEdit={canEdit}
              newTitle={newTitle}
              setNewTitle={setNewTitle}
              handleAddTask={handleAddTask}
              toggleDone={toggleDone}
              setSelected={setSelected}
              inputRef={inputRef}
            />
          )}
          {view === 'kanban' && (
            <div className="h-full overflow-hidden">
              <KanbanBoard
                tasks={tasks ?? []}
                projectId={projectId}
                onOpenTask={setSelected}
                canEdit={canEdit}
              />
            </div>
          )}
          {view === 'calendar' && (
            <CalendarView
              tasks={tasks ?? []}
              projectId={projectId}
              canEdit={canEdit}
            />
          )}
        </ErrorBoundary>
      </div>

      {/* Bottom nav — mobile only, replaces topbar view toggle */}
      {isMobile && (
        <Suspense fallback={null}>
          <BottomNav onMore={() => setShowMoreSheet(true)} />
          {showMoreSheet && (
            <MoreSheet
              onClose={() => setShowMoreSheet(false)}
            />
          )}
        </Suspense>
      )}

      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          projectId={projectId}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

/* ──── MoreSheet — mobile bottom sheet for overflow actions ──── */
function MoreSheet({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,.5)' }}
        onClick={onClose}
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl p-3 pb-8"
        style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-strong)' }}
      >
        <div className="w-9 h-1 rounded-full mx-auto mb-3" style={{ background: 'var(--bg-active)' }} />
        <button
          onClick={onClose}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm"
          style={{ color: 'var(--text-primary)' }}
        >
          ✕ Close
        </button>
      </div>
    </>
  )
}

/* ──── Group header with divider line ──── */
function GroupHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-3 mb-3 mt-6 first:mt-0">
      <span className="section-label whitespace-nowrap">
        {label} · {count}
      </span>
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
    </div>
  )
}

/* ──── List view content ──── */
function ListContent({
  tasks, canEdit, newTitle, setNewTitle, handleAddTask, toggleDone, setSelected, inputRef,
}: {
  tasks: Task[] | undefined
  canEdit: boolean
  newTitle: string
  setNewTitle: (title: string) => void
  handleAddTask: () => void
  toggleDone: (task: Task) => void
  setSelected: (task: Task | null) => void
  inputRef: React.RefObject<HTMLInputElement | null>
}) {
  const openTasks = tasks?.filter((t: Task) => !t.is_done && !t.parent) ?? []
  const doneTasks = tasks?.filter((t: Task) =>  t.is_done && !t.parent) ?? []

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8 h-full overflow-y-auto">
      {/* Add task bar */}
      {canEdit && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-[14px] cursor-text mb-5 transition-all"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
          }}
          onClick={() => inputRef.current?.focus()}
        >
          <div
            className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center"
            style={{ border: '1.5px solid var(--text-muted)', color: 'var(--text-muted)', fontSize: '0.875rem' }}
          >
            +
          </div>
          <input
            ref={inputRef}
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddTask()}
            placeholder="Add a task… press ↵ Enter to save"
            className="flex-1 bg-transparent outline-none"
            style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: 1.5 }}   /* 15px */
          />
        </div>
      )}

      {openTasks.length === 0 && doneTasks.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No tasks yet"
          description="Add your first task to start tracking your work."
          action={canEdit ? {
            label:   '+ Add your first task',
            onClick: () => inputRef.current?.focus(),
          } : undefined}
        />
      ) : (
        <>
          {openTasks.length > 0 && (
            <>
              <GroupHeader label="Open" count={openTasks.length} />
              <div className="space-y-0.5">
                {openTasks.map((task: Task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={() => toggleDone(task)}
                    onOpen={() => setSelected(task)}
                  />
                ))}
              </div>
            </>
          )}

          {doneTasks.length > 0 && (
            <>
              <GroupHeader label="Completed" count={doneTasks.length} />
              <div className="space-y-0.5 opacity-60">
                {doneTasks.map((task: Task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={() => toggleDone(task)}
                    onOpen={() => setSelected(task)}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
