'use client'
import { groupProjectsFromMembers } from '@/lib/hooks/use-team'
import type { TeamMember } from '@/lib/hooks/use-team'

interface Props {
  members:  TeamMember[]
  activeId: number | null
  onSelect: (id: number) => void
}

function Avatar({ name, avatar, size = 5 }: { name: string; avatar: string | null; size?: number }) {
  const cls = `w-${size} h-${size} rounded-full flex items-center justify-center text-[8px] font-bold text-white overflow-hidden flex-shrink-0`
  return (
    <div className={cls} style={{ background: 'var(--accent)', border: '1.5px solid var(--bg-surface)' }}>
      {avatar
        ? <img src={avatar} alt="" className="w-full h-full object-cover" />
        : name[0]?.toUpperCase()}
    </div>
  )
}

export function ChannelList({ members, activeId, onSelect }: Props) {
  const channels = groupProjectsFromMembers(members)

  return (
    <div
      className="w-52 flex-shrink-0 flex flex-col"
      style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}
    >
      <div
        className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest"
        style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}
      >
        Channels
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {channels.length === 0 && (
          <p className="text-xs px-2 py-8 text-center leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Join or create a project<br />to see channels here
          </p>
        )}

        {channels.map(c => {
          const isActive = activeId === c.id
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-left transition-all"
              style={{
                background: isActive ? 'var(--accent-dim)' : 'transparent',
                border: isActive ? '1px solid rgba(124,106,240,.2)' : '1px solid transparent',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
            >
              {/* Color dot */}
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: c.color }}
              />

              {/* Channel name */}
              <span
                className="flex-1 text-xs font-medium truncate"
                style={{ color: isActive ? '#a89cf5' : 'var(--text-secondary)' }}
              >
                # {c.title}
              </span>

              {/* Member avatar stack */}
              <div className="flex -space-x-1.5 flex-shrink-0">
                {c.members.slice(0, 3).map(m => (
                  <Avatar key={m.id} name={m.name} avatar={m.avatar} size={5} />
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
