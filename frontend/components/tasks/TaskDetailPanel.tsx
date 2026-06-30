'use client'
import { useState, useRef } from 'react'
import { useTask, useUpdateTask } from '@/lib/hooks/use-tasks'
import type { Task } from '@/lib/hooks/use-tasks'
import { useIsMobile } from '@/lib/hooks/use-media-query'
import { TiptapEditor }    from '@/components/ui/TiptapEditor'
import { TaskAttachments } from './TaskAttachments'
import { TaskComments }    from './TaskComments'
import { SubtaskList }     from './SubtaskList'
import { TaskActivity }    from './TaskActivity'
import { ReminderPicker }  from './ReminderPicker'
import { usePermissions } from '@/lib/hooks/use-members'

const TABS = [
  { id: 'details',   label: 'Details'   },
  { id: 'subtasks',  label: 'Subtasks'  },
  { id: 'comments',  label: 'Comments'  },
  { id: 'files',     label: 'Files'     },
  { id: 'activity',  label: 'Activity'  },
]

const STATUS_OPTIONS = [
  {
    value: 'todo',
    label: 'To Do',
    icon: '○',
    color: '#9397b3',
    activeBg: 'rgba(139,143,168,.18)',
    activeBorder: 'rgba(139,143,168,.5)',
    activeColor: '#c8cbe0',
  },
  {
    value: 'in_progress',
    label: 'In Progress',
    icon: '◑',
    color: '#60a5fa',
    activeBg: 'rgba(96,165,250,.15)',
    activeBorder: 'rgba(96,165,250,.5)',
    activeColor: '#93c5fd',
  },
  {
    value: 'done',
    label: 'Done',
    icon: '✓',
    color: '#34d399',
    activeBg: 'rgba(52,211,153,.15)',
    activeBorder: 'rgba(52,211,153,.5)',
    activeColor: '#6ee7b7',
  },
]

interface Props {
  task: Task
  projectId: number
  onClose: () => void
}

export function TaskDetailPanel({ task, projectId, onClose }: Props) {
  const { data: detail }    = useTask(task.id)
  const updateTask          = useUpdateTask(projectId)
  const { canEdit }         = usePermissions(projectId)
  const isMobile            = useIsMobile()
  const [tab, setTab]       = useState('details')
  const [title, setTitle]   = useState(task.title)
  const descTimer           = useRef<NodeJS.Timeout | null>(null)

  // Optimistic done state — updates instantly on click, syncs with server asynchronously
  const [isDone, setIsDone] = useState(task.is_done)

  // Keep in sync if task prop changes (e.g. from parent list update)
  const prevTaskId = useRef(task.id)
  if (prevTaskId.current !== task.id) {
    prevTaskId.current = task.id
    setIsDone(task.is_done)
  }

  const currentStatus = detail?.status || task.status

  const save = (fields: Partial<Task>) =>
    updateTask.mutate({ id: task.id, ...fields })

  const handleToggleDone = () => {
    const next = !isDone
    setIsDone(next)  // instant UI feedback
    save(next
      ? { is_done: true,  status: 'done' }
      : { is_done: false, status: 'todo' }
    )
  }

  return (
    <>
      {/* Backdrop — only on desktop; mobile panel is full-screen */}
      {!isMobile && (
        <div className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onClose} />
      )}

      <div
        className="fixed z-50 flex flex-col"
        style={isMobile ? {
          // Mobile: full-screen, slides up from bottom
          inset: 0,
          background: 'var(--bg-surface)',
          animation: 'slideUpFull .25s ease',
        } : {
          // Desktop: 440px side panel from right
          right: 0, top: 0, height: '100%', width: '440px',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border)',
          animation: 'slideInRight .25s ease',
        }}
      >

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="px-5 pt-4 pb-3 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}>

          {/* Title row */}
          <div className="flex items-start gap-2.5 mb-4">
            <button
              onClick={handleToggleDone}
              disabled={!canEdit}
              className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
              style={{
                background: isDone ? '#34d399' : 'transparent',
                border: isDone ? 'none' : '1.5px solid var(--text-muted)',
                boxShadow: isDone ? '0 0 8px rgba(52,211,153,.4)' : 'none',
              }}>
              {isDone && <span className="text-[10px] font-bold" style={{ color: '#0e0f14' }}>✓</span>}
            </button>
            <input value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={() => save({ title })}
              readOnly={!canEdit}
              placeholder="Task title"
              className="flex-1 font-semibold bg-transparent outline-none leading-snug"
              style={{ fontSize: '15px', color: 'var(--text-primary)' }} />
            <button onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-sm flex-shrink-0 transition-colors"
              style={{ background: 'var(--bg-active)', color: 'var(--text-muted)' }}
              aria-label="Close">✕</button>
          </div>

          {/* ── Status selector ────────────────────────────────── */}
          <div className="flex gap-2 pl-7">
            {STATUS_OPTIONS.map(opt => {
              // Show 'done' as active if optimistic isDone is true
              const isActive = isDone
                ? opt.value === 'done'
                : currentStatus === opt.value
              return (
                <button
                  key={opt.value}
                  disabled={!canEdit}
                  onClick={() => {
                    const nextDone = opt.value === 'done'
                    setIsDone(nextDone)
                    save({ status: opt.value, is_done: nextDone })
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background:   isActive ? opt.activeBg   : 'var(--bg-elevated)',
                    border:       `1.5px solid ${isActive ? opt.activeBorder : 'var(--border)'}`,
                    color:        isActive ? opt.activeColor : 'var(--text-muted)',
                    boxShadow:    isActive ? `0 0 10px ${opt.activeBorder}` : 'none',
                    transform:    isActive ? 'scale(1.04)' : 'scale(1)',
                  }}>
                  <span style={{ fontSize: '13px', lineHeight: 1 }}>{opt.icon}</span>
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Tab bar ──────────────────────────────────────────── */}
        <div className="flex overflow-x-auto flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-4 py-2.5 text-xs font-medium transition-colors whitespace-nowrap"
              style={{
                borderBottom: `2px solid ${tab === t.id ? 'var(--accent)' : 'transparent'}`,
                color: tab === t.id ? '#a89cf5' : 'var(--text-muted)',
              }}>{t.label}</button>
          ))}
        </div>

        {/* ── Tab content ──────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'details' && (
            <div className="space-y-4">
              {[
                {
                  label: 'Priority',
                  content: (
                    <select value={detail?.priority ?? 0}
                      onChange={e => save({ priority: +e.target.value })}
                      disabled={!canEdit}
                      className="text-xs bg-transparent outline-none cursor-pointer"
                      style={{ color: 'var(--text-secondary)' }}>
                      <option value="0">None</option>
                      <option value="1">Low</option>
                      <option value="2">Medium</option>
                      <option value="3">High</option>
                      <option value="4">Urgent</option>
                    </select>
                  ),
                },
                {
                  label: 'Due date',
                  content: (
                    <input type="date"
                      value={detail?.due_date?.slice(0, 10) || ''}
                      onChange={e => save({ due_date: e.target.value || null })}
                      readOnly={!canEdit}
                      className="text-xs bg-transparent outline-none cursor-pointer"
                      style={{ color: 'var(--text-secondary)' }} />
                  ),
                },
                {
                  label: 'Reminder',
                  content: <ReminderPicker taskId={task.id} canEdit={canEdit ?? false} />,
                },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-3 py-1.5"
                  style={{ borderBottom: '1px solid var(--border)' }}>
                  <span className="w-20 text-xs flex-shrink-0"
                    style={{ color: 'var(--text-muted)' }}>{f.label}</span>
                  {f.content}
                </div>
              ))}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                  style={{ color: 'var(--text-muted)' }}>Description</p>
                <TiptapEditor
                  content={detail?.description || ''}
                  editable={canEdit ?? false}
                  onChange={html => {
                    if (descTimer.current) clearTimeout(descTimer.current)
                    descTimer.current = setTimeout(() => save({ description: html }), 1000)
                  }}
                />
              </div>
            </div>
          )}
          {tab === 'subtasks'  && <SubtaskList task={task} projectId={projectId} canEdit={canEdit ?? false} />}
          {tab === 'comments'  && <TaskComments taskId={task.id} />}
          {tab === 'files'     && <TaskAttachments taskId={task.id} canEdit={canEdit ?? false} />}
          {tab === 'activity'  && <TaskActivity taskId={task.id} />}
        </div>
      </div>
    </>
  )
}
