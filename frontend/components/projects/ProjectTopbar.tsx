'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { MembersPanel } from '@/components/members/MembersPanel'

const VIEWS = [
  { key: 'list',   icon: '≡', label: 'List'  },
  { key: 'kanban', icon: '⊞', label: 'Board' },
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
  const view         = searchParams.get('view') || 'list'
  const [showMembers, setShowMembers] = useState(false)

  return (
    <>
      <div
        className="flex items-center gap-3 px-5 flex-shrink-0"
        style={{
          height: '56px',   /* slightly taller for breathing room */
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {/* Project color + title */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: project?.color || 'var(--accent)' }}
          />
          <h1
            className="font-semibold truncate text-base"
            style={{ color: 'var(--text-primary)', lineHeight: 1.3 }}
          >
            {project?.title || 'Loading…'}
          </h1>
        </div>

        {/* Role pill — min 12px */}
        {role && (
          <span
            className="tag capitalize"
            style={{
              background: 'var(--bg-active)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              fontSize: '0.75rem',   /* 12px */
            }}
          >
            {role}
          </span>
        )}

        {/* Members button — 13px text */}
        <button
          onClick={() => setShowMembers(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] transition-all text-sm"
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
          <span>👥</span>
          <span>{memberCount}</span>
        </button>

        {/* View toggle — 13px text */}
        <div
          className="flex overflow-hidden rounded-[10px]"
          style={{
            border: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
          }}
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
      </div>

      {showMembers && (
        <MembersPanel projectId={projectId} onClose={() => setShowMembers(false)} />
      )}
    </>
  )
}
