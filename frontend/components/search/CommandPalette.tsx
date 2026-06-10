'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSearch } from '@/lib/hooks/use-search'
import type { SearchTask, SearchProject } from '@/lib/hooks/use-search'

const PRIORITY_COLORS: Record<number, string> = {
  0: '#4a4e65', 1: '#60a5fa', 2: '#fbbf24', 3: '#fb923c', 4: '#f87171',
}

const STATUS_ICONS: Record<string, string> = {
  todo:        '○',
  in_progress: '◑',
  done:        '✓',
}

interface Props { onClose: () => void }

type Item =
  | { kind: 'task';    data: SearchTask }
  | { kind: 'project'; data: SearchProject }

export function CommandPalette({ onClose }: Props) {
  const router                         = useRouter()
  const [query, setQuery]              = useState('')
  const [cursor, setCursor]            = useState(0)
  const inputRef                       = useRef<HTMLInputElement>(null)
  const listRef                        = useRef<HTMLDivElement>(null)
  const { data, isFetching }           = useSearch(query)

  // Flatten results into one navigable list
  const items: Item[] = [
    ...(data?.tasks    ?? []).map(t => ({ kind: 'task'    as const, data: t })),
    ...(data?.projects ?? []).map(p => ({ kind: 'project' as const, data: p })),
  ]

  // Focus input on mount
  useEffect(() => { inputRef.current?.focus() }, [])

  // Scroll active item into view
  useEffect(() => {
    const active = listRef.current?.querySelector('[data-active="true"]') as HTMLElement
    active?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  // Reset cursor when results change
  useEffect(() => setCursor(0), [query])

  const handleSelect = useCallback((item: Item) => {
    if (item.kind === 'task') {
      router.push(`/dashboard/projects/${item.data.project_id}?task=${item.data.id}`)
    } else {
      router.push(`/dashboard/projects/${item.data.id}`)
    }
    onClose()
  }, [router, onClose])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setCursor(c => Math.min(c + 1, items.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setCursor(c => Math.max(c - 1, 0))
      }
      if (e.key === 'Enter' && items[cursor]) {
        handleSelect(items[cursor])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cursor, items, onClose, handleSelect])

  const taskCount    = data?.tasks?.length    ?? 0
  const projectCount = data?.projects?.length ?? 0
  const hasResults   = taskCount > 0 || projectCount > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4"
      style={{ paddingTop: '12vh', background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="w-full max-w-[580px] rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background:  'var(--bg-elevated)',
          border:      '1px solid var(--border-strong)',
          boxShadow:   '0 32px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.06)',
          animation:   'palette-in 0.15s cubic-bezier(0.16,1,0.3,1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Search input ── */}
        <div
          className="flex items-center gap-3 px-4 py-3.5"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          {/* Icon — spins when fetching */}
          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-base"
            style={{ color: 'var(--text-muted)', transition: 'opacity .15s' }}>
            {isFetching ? (
              <span style={{ display: 'inline-block', animation: 'spin 0.7s linear infinite' }}>⟳</span>
            ) : '🔍'}
          </div>

          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tasks and projects…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--text-primary)' }}
          />

          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs px-1.5 py-0.5 rounded transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >✕</button>
          )}

          <kbd
            className="text-[10px] px-1.5 py-0.5 rounded font-mono flex-shrink-0"
            style={{
              background: 'var(--bg-active)',
              color:      'var(--text-muted)',
              border:     '1px solid var(--border-strong)',
            }}
          >ESC</kbd>
        </div>

        {/* ── Results ── */}
        <div ref={listRef} className="max-h-[400px] overflow-y-auto py-2">

          {/* Empty state — before typing */}
          {query.length < 2 && (
            <div className="flex flex-col items-center gap-3 py-10">
              <span className="text-3xl">🔍</span>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Type to search tasks and projects
              </p>
              <div className="flex gap-3 mt-1">
                {[
                  ['Ctrl', 'K', 'Open/close'],
                  ['↑↓',  '',  'Navigate'],
                  ['↵',   '',  'Open'],
                ].map(([key, key2, hint]) => (
                  <div key={hint} className="flex items-center gap-1.5 text-[10px]"
                    style={{ color: 'var(--text-muted)' }}>
                    <kbd className="px-1.5 py-0.5 rounded text-[9px] font-mono"
                      style={{ background: 'var(--bg-active)', border: '1px solid var(--border-strong)' }}>
                      {key}{key2 && <span className="ml-0.5">{key2}</span>}
                    </kbd>
                    {hint}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {query.length >= 2 && !hasResults && !isFetching && (
            <div className="flex flex-col items-center gap-2 py-10">
              <span className="text-2xl">🌑</span>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                No results for <span style={{ color: 'var(--text-secondary)' }}>"{query}"</span>
              </p>
            </div>
          )}

          {/* ── Task results ── */}
          {taskCount > 0 && (
            <div>
              <div
                className="px-4 pt-1 pb-1.5 text-[10px] font-semibold tracking-widest uppercase"
                style={{ color: 'var(--text-muted)' }}
              >
                Tasks
              </div>
              {(data?.tasks ?? []).map((task, i) => {
                const isActive = cursor === i
                return (
                  <div
                    key={task.id}
                    data-active={isActive}
                    className="flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors"
                    style={{
                      background: isActive ? 'var(--accent-dim)' : 'transparent',
                    }}
                    onClick={() => handleSelect({ kind: 'task', data: task })}
                    onMouseEnter={() => setCursor(i)}
                  >
                    {/* Priority dot */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                      style={{ background: PRIORITY_COLORS[task.priority] + '20' }}
                    >
                      {STATUS_ICONS[task.status] || '📋'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate transition-colors"
                        style={{ color: isActive ? '#a89cf5' : 'var(--text-primary)' }}
                      >
                        {task.title}
                      </p>
                      <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {task.project_title}
                      </p>
                    </div>

                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: PRIORITY_COLORS[task.priority] }}
                    />
                    {isActive && (
                      <span className="text-[10px] flex-shrink-0" style={{ color: '#a89cf5' }}>↵</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Project results ── */}
          {projectCount > 0 && (
            <div className={taskCount > 0 ? 'mt-1' : ''}>
              <div
                className="px-4 pt-1 pb-1.5 text-[10px] font-semibold tracking-widest uppercase"
                style={{ color: 'var(--text-muted)' }}
              >
                Projects
              </div>
              {(data?.projects ?? []).map((project, i) => {
                const idx      = taskCount + i
                const isActive = cursor === idx
                return (
                  <div
                    key={project.id}
                    data-active={isActive}
                    className="flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors"
                    style={{ background: isActive ? 'var(--accent-dim)' : 'transparent' }}
                    onClick={() => handleSelect({ kind: 'project', data: project })}
                    onMouseEnter={() => setCursor(idx)}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                      style={{ background: project.color + '25' }}
                    >
                      📁
                    </div>
                    <p
                      className="flex-1 text-sm font-medium transition-colors"
                      style={{ color: isActive ? '#a89cf5' : 'var(--text-primary)' }}
                    >
                      {project.title}
                    </p>
                    <span className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: project.color }} />
                    {isActive && (
                      <span className="text-[10px] flex-shrink-0" style={{ color: '#a89cf5' }}>↵</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Footer hints ── */}
        <div
          className="flex items-center gap-5 px-4 py-2.5"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          {[
            ['↑↓', 'Navigate'],
            ['↵',  'Open'],
            ['Esc','Close'],
          ].map(([key, label]) => (
            <span key={label} className="flex items-center gap-1.5 text-[10px]"
              style={{ color: 'var(--text-muted)' }}>
              <kbd className="px-1.5 py-0.5 rounded font-mono text-[9px]"
                style={{ background: 'var(--bg-active)', border: '1px solid var(--border-strong)' }}>
                {key}
              </kbd>
              {label}
            </span>
          ))}
          <span className="ml-auto text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {hasResults && query.length >= 2
              ? `${taskCount + projectCount} result${taskCount + projectCount !== 1 ? 's' : ''}`
              : ''}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes palette-in {
          from { opacity: 0; transform: scale(0.97) translateY(-8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
