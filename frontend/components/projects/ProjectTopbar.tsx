'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { useIsMobile } from '@/lib/hooks/use-media-query'
import { MembersPanel }        from '@/components/members/MembersPanel'
import { ProjectSettingsPanel } from '@/components/settings/ProjectSettingsPanel'
import { ProjectForumPanel }    from '@/components/projects/ProjectForumPanel'

const VIEWS = [
  { key: 'list',     icon: '≡',  label: 'List'     },
  { key: 'kanban',   icon: '⊞',  label: 'Board'    },
  { key: 'calendar', icon: '📅', label: 'Calendar' },
]

interface Props {
  project: any
  role?: string
  memberCount?: number
  projectId: number
}

export function ProjectTopbar({ project, role, memberCount = 0, projectId }: Props) {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const isMobile     = useIsMobile()
  const view         = searchParams.get('view') || project?.default_view || 'list'
  const [showMembers, setShowMembers]   = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showForum, setShowForum]       = useState(false)

  return (
    <>
      <div
        className="flex items-center gap-2 px-3 md:px-5 flex-shrink-0"
        style={{
          height: '52px',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {/* Project color + title */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: project?.color || 'var(--accent)' }}
          />
          <h1
            className="font-semibold truncate"
            style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.3 }}
          >
            {project?.title || 'Loading…'}
          </h1>
        </div>

        {/* Role pill — hidden on mobile */}
        {role && !isMobile && (
          <span
            className="tag capitalize"
            style={{
              background: 'var(--bg-active)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              fontSize: '0.75rem',
            }}
          >
            {role}
          </span>
        )}

        {/* Members button — icon-only on mobile */}
        <button
          onClick={() => setShowMembers(true)}
          className="flex items-center gap-1.5 rounded-[10px] transition-all text-sm flex-shrink-0"
          style={{
            padding: isMobile ? '6px 8px' : '6px 12px',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            background: 'var(--bg-elevated)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--border-strong)'
            e.currentTarget.style.color = 'var(--text-primary)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }}
        >
          <span>👥</span>
          {!isMobile && <span>{memberCount}</span>}
        </button>

        {/* Settings button */}
        <button
          onClick={() => setShowSettings(true)}
          title="Project settings"
          className="flex items-center justify-center w-8 h-8 rounded-[10px] transition-all text-sm flex-shrink-0"
          style={{
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            background: 'var(--bg-elevated)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--border-strong)'
            e.currentTarget.style.color = 'var(--text-primary)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }}
        >
          ⚙
        </button>

        {/* Forum button — hidden on mobile (fits in More sheet via BottomNav) */}
        {!isMobile && (
          <button
            onClick={() => setShowForum(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] transition-all text-sm font-medium"
            style={{
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              background: 'var(--bg-elevated)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--border-strong)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
          >
            <span>💬</span>
            <span>Forum</span>
          </button>
        )}

        {/* View toggle — desktop only; mobile uses BottomNav */}
        {!isMobile && (
          <div
            className="flex overflow-hidden rounded-[10px]"
            style={{ border: '1px solid var(--border)', background: 'var(--bg-elevated)' }}
          >
            {VIEWS.map(v => (
              <button
                key={v.key}
                onClick={() => router.replace(`?view=${v.key}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-all"
                style={{
                  background: view === v.key ? 'var(--accent)' : 'transparent',
                  color: view === v.key ? 'white' : 'var(--text-secondary)',
                }}
              >
                <span>{v.icon}</span>{v.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {showMembers && (
        <MembersPanel projectId={projectId} onClose={() => setShowMembers(false)} />
      )}
      {showSettings && project && (
        <ProjectSettingsPanel
          project={project}
          onClose={() => setShowSettings(false)}
          onOpenMembers={() => { setShowSettings(false); setShowMembers(true) }}
        />
      )}
      {showForum && (
        <ProjectForumPanel
          projectId={projectId}
          projectTitle={project?.title}
          onClose={() => setShowForum(false)}
        />
      )}
    </>
  )
}
