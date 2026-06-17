'use client'
import { useMemberMatrix } from '@/lib/hooks/use-forum'
import type { MatrixUser } from '@/lib/hooks/use-forum'
import Link from 'next/link'

const ROLE_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  owner:  { bg: 'rgba(251,191,36,.12)', color: '#fbbf24', label: 'Owner' },
  admin:  { bg: 'rgba(124,106,240,.12)', color: '#a89cf5', label: 'Admin' },
  editor: { bg: 'rgba(52,211,153,.12)',  color: '#34d399', label: 'Editor' },
  viewer: { bg: 'rgba(148,163,184,.12)', color: '#94a3b8', label: 'Viewer' },
}

export function MemberProjectMatrix() {
  const { data: users = [], isLoading } = useMemberMatrix()

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[1,2,3].map(i => (
          <div key={i} className="animate-pulse rounded-xl p-4" style={{ background: 'var(--bg-elevated)' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full" style={{ background: 'var(--bg-active)' }} />
              <div className="h-3 w-24 rounded" style={{ background: 'var(--bg-active)' }} />
            </div>
            <div className="flex gap-2">
              <div className="h-5 w-16 rounded-full" style={{ background: 'var(--bg-active)' }} />
              <div className="h-5 w-20 rounded-full" style={{ background: 'var(--bg-active)' }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6">
        <div className="text-3xl mb-3">👥</div>
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          No team members yet
        </p>
        <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          Add members to your projects to see the assignment matrix here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1 p-3">
      {users.map((user: MatrixUser) => {
        const initials = user.name
          ?.split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2) || '?'

        return (
          <div
            key={user.id}
            className="rounded-xl px-4 py-3 transition-all"
            style={{ background: 'var(--bg-elevated)' }}
          >
            {/* User info row */}
            <div className="flex items-center gap-3 mb-2.5">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, var(--accent), #a78bfa)' }}
                >
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {user.name}
                </p>
                <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                  {user.email}
                </p>
              </div>
            </div>

            {/* Project badges */}
            <div className="flex flex-wrap gap-1.5">
              {user.projects.map(project => {
                const role = ROLE_BADGE[project.role] || ROLE_BADGE.viewer
                return (
                  <Link
                    key={project.id}
                    href={`/dashboard/projects/${project.id}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
                    style={{
                      background: 'var(--bg-active)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                    }}
                    title={`${project.title} — ${role.label}`}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: project.color }}
                    />
                    <span className="truncate max-w-[100px]">{project.title}</span>
                    <span
                      className="text-[9px] px-1 py-0.5 rounded font-semibold"
                      style={{ background: role.bg, color: role.color }}
                    >
                      {role.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
