'use client'
import type { TeamMember } from '@/lib/hooks/use-team'

function Avatar({ name, avatar }: { name: string; avatar: string | null }) {
  return (
    <div
      className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 overflow-hidden"
      style={{ background: 'var(--accent)' }}
    >
      {avatar
        ? <img src={avatar} alt="" className="w-full h-full object-cover" />
        : name[0]?.toUpperCase()}
    </div>
  )
}

export function ActivityBoard({ members }: { members: TeamMember[] }) {
  return (
    <div
      className="w-64 flex-shrink-0 flex flex-col overflow-hidden"
      style={{ background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)' }}
    >
      <div
        className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest"
        style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}
      >
        Team Activity
      </div>

      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {members.length === 0 && (
          <p className="text-xs px-2 py-8 text-center leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            No teammates yet
          </p>
        )}

        {members.map(m => (
          <div
            key={m.id}
            className="p-3 rounded-xl transition-all"
            style={{
              background: 'var(--bg-elevated)',
              border:     '1px solid var(--border)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,106,240,.25)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            {/* Name + task count row */}
            <div className="flex items-center gap-2 mb-2">
              <Avatar name={m.name} avatar={m.avatar} />
              <span className="text-xs font-bold flex-1 truncate" style={{ color: 'var(--text-primary)' }}>
                {m.name}
              </span>
              {m.open_task_count > 0 && (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'var(--accent-dim)', color: '#a89cf5' }}
                >
                  {m.open_task_count} task{m.open_task_count !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Project chips */}
            {m.projects.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {m.projects.map(p => (
                  <span
                    key={p.id}
                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: p.color + '22', color: p.color }}
                  >
                    {p.title}
                  </span>
                ))}
              </div>
            )}

            {/* Current tasks */}
            {m.current_tasks.length > 0 ? (
              <div className="space-y-0.5">
                {m.current_tasks.map((t, i) => (
                  <p
                    key={i}
                    className="text-[10px] truncate"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    › {t}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                Nothing assigned right now
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
