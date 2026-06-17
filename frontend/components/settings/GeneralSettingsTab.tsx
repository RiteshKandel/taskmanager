'use client'
import { useState, useEffect, useRef } from 'react'
import { useUpdateProject, useProjectsFlat } from '@/lib/hooks/use-projects'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { notify } from '@/lib/toast'

const VIEWS = [
  { val: 'list',     label: '≡ List'     },
  { val: 'kanban',   label: '⊞ Board'    },
  { val: 'calendar', label: '📅 Calendar' },
]

interface Props { project: any; canEdit: boolean }

export function GeneralSettingsTab({ project, canEdit }: Props) {
  const updateProject = useUpdateProject()
  const [title, setTitle]      = useState(project.title)
  const [description, setDesc] = useState(project.description || '')
  const [parentSearch, setParentSearch] = useState('')
  const [debounced, setDebounced]       = useState('')
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Keep local state in sync when project data refreshes
  useEffect(() => { setTitle(project.title) }, [project.title])
  useEffect(() => { setDesc(project.description || '') }, [project.description])

  useEffect(() => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setDebounced(parentSearch), 300)
  }, [parentSearch])

  const { data: suggestions = [] } = useProjectsFlat(debounced)

  const save = (data: Record<string, unknown>) => {
    updateProject.mutate(
      { id: project.id, ...data },
      { onSuccess: () => notify.projectUpdated() }
    )
  }

  const inputStyle = {
    background: 'var(--bg-active)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
  }

  return (
    <div className="space-y-5">
      {/* Title */}
      <div>
        <label
          className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5"
          style={{ color: 'var(--text-muted)' }}
        >
          Title
        </label>
        <input
          value={title}
          disabled={!canEdit}
          onChange={e => setTitle(e.target.value)}
          onBlur={() => title.trim() && title !== project.title && save({ title: title.trim() })}
          className="w-full text-sm rounded-lg px-3 py-2.5 outline-none"
          style={inputStyle}
        />
      </div>

      {/* Description */}
      <div>
        <label
          className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5"
          style={{ color: 'var(--text-muted)' }}
        >
          Description
        </label>
        <textarea
          value={description}
          disabled={!canEdit}
          rows={3}
          onChange={e => setDesc(e.target.value)}
          onBlur={() => description !== project.description && save({ description })}
          className="w-full text-sm rounded-lg px-3 py-2.5 outline-none resize-none"
          style={inputStyle}
        />
      </div>

      {/* Color */}
      <div>
        <label
          className="block text-[10px] font-semibold uppercase tracking-wider mb-2"
          style={{ color: 'var(--text-muted)' }}
        >
          Color
        </label>
        <ColorPicker
          value={project.color}
          onChange={canEdit ? (color: string) => save({ color }) : () => {}}
        />
      </div>

      {/* Default view */}
      <div>
        <label
          className="block text-[10px] font-semibold uppercase tracking-wider mb-2"
          style={{ color: 'var(--text-muted)' }}
        >
          Default view
        </label>
        <div className="flex gap-2 flex-wrap">
          {VIEWS.map(v => (
            <button
              key={v.val}
              disabled={!canEdit}
              onClick={() => save({ default_view: v.val })}
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
              style={{
                background: project.default_view === v.val ? 'var(--accent-dim)' : 'var(--bg-active)',
                color:      project.default_view === v.val ? '#a89cf5' : 'var(--text-muted)',
                border:     `1px solid ${project.default_view === v.val ? 'rgba(124,106,240,.4)' : 'var(--border)'}`,
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Move to a different parent */}
      {canEdit && (
        <div className="relative">
          <label
            className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5"
            style={{ color: 'var(--text-muted)' }}
          >
            Move to project
          </label>
          <input
            value={parentSearch}
            onChange={e => setParentSearch(e.target.value)}
            placeholder="Search for a new parent…"
            className="w-full text-sm rounded-lg px-3 py-2.5 outline-none"
            style={inputStyle}
          />
          {suggestions.length > 0 && parentSearch.length > 0 && (
            <div
              className="absolute z-10 w-full mt-1 rounded-lg overflow-hidden max-h-40 overflow-y-auto"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)' }}
            >
              {(suggestions as Array<{ id: number; title: string; path: string; color: string }>)
                .filter(p => p.id !== project.id)
                .map(p => (
                  <button
                    key={p.id}
                    onClick={() => { save({ parent: p.id }); setParentSearch('') }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                    {p.path}
                  </button>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
