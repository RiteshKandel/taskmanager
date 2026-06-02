'use client'
import { useState, useRef, Suspense } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useProject } from '@/lib/hooks/use-projects'
import type { Task } from '@/lib/hooks/use-tasks'
import { useTasks, useCreateTask, useUpdateTask } from '@/lib/hooks/use-tasks'
import { usePermissions, useMembers } from '@/lib/hooks/use-members'
import { ProjectTopbar } from '@/components/projects/ProjectTopbar'
import { TaskRow } from '@/components/tasks/TaskRow'
import { TaskDetailPanel } from '@/components/tasks/TaskDetailPanel'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'

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
  const view = (searchParams.get('view') || 'list') as 'list' | 'kanban'

  const { data: project }            = useProject(projectId)
  const { data: tasks, isLoading }   = useTasks(projectId)
  const { canEdit, canManage, role } = usePermissions(projectId)
  const { data: members = [] }       = useMembers(projectId)
  const memberCount = Array.isArray(members) ? members.length : 0
  const createTask = useCreateTask(projectId)
  const updateTask = useUpdateTask(projectId)

  const [newTitle, setNewTitle]       = useState('')
  const [selectedTask, setSelected]   = useState<Task | null>(null)
  const inputRef                      = useRef<HTMLInputElement>(null)

  const handleAddTask = async () => {
    if (!newTitle.trim()) return
    await createTask.mutateAsync({ title: newTitle })
    setNewTitle('')
  }

  const toggleDone = (task: Task) =>
    updateTask.mutate({ id: task.id, is_done: !task.is_done })

  if (isLoading)
    return <div className="p-8" style={{ color: 'var(--text-muted)' }}>Loading…</div>

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg-base)' }}>
      <ProjectTopbar
        project={project}
        role={role}
        memberCount={memberCount}
        projectId={projectId}
      />

      <div className="flex-1 overflow-hidden">
        {view === 'list' ? (
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
        ) : (
          <div className="h-full overflow-hidden">
            <KanbanBoard
              tasks={tasks ?? []}
              projectId={projectId}
              onOpenTask={setSelected}
              canEdit={canEdit}
            />
          </div>
        )}
      </div>

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
    <div className="max-w-4xl mx-auto px-8 py-8 h-full overflow-y-auto">
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

      {tasks?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
            style={{ background: 'var(--bg-elevated)' }}
          >
            <span className="text-3xl">📝</span>
          </div>
          <h3
            className="mb-2"
            style={{ color: 'var(--text-primary)', fontSize: '1.125rem' }}
          >
            No tasks yet
          </h3>
          <p
            className="max-w-sm"
            style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}
          >
            Get started by adding a task above to keep track of what needs to be done.
          </p>
        </div>
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
