'use client'
import { useMembers } from '@/lib/hooks/use-members'

interface Props {
  projectId: number
  canManage: boolean
  onOpenMembers: () => void
}

export function MembersSettingsTab({ projectId, canManage, onOpenMembers }: Props) {
  const { data: members = [] } = useMembers(projectId)

  const roleColors: Record<string, string> = {
    owner:  '#a89cf5',
    admin:  '#60a5fa',
    editor: '#34d399',
    viewer: 'var(--text-muted)',
  }

  return (
    <div>
      <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
        {members.length} member{members.length !== 1 ? 's' : ''} in this project
      </p>

      <div className="space-y-2 mb-4">
        {(members as Array<{ id: number; user: { id: number; name: string; email: string; avatar: string | null }; role: string }>)
          .slice(0, 8)
          .map(m => (
            <div
              key={m.id}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                style={{ background: 'var(--accent-dim)', color: '#a89cf5' }}
              >
                {m.user.name?.[0]?.toUpperCase() || '?'}
              </div>
              <span className="flex-1 truncate" style={{ color: 'var(--text-primary)' }}>
                {m.user.name}
              </span>
              <span
                className="capitalize font-medium"
                style={{ color: roleColors[m.role] || 'var(--text-muted)' }}
              >
                {m.role}
              </span>
            </div>
          ))}

        {members.length > 8 && (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            +{members.length - 8} more members
          </p>
        )}
      </div>

      {canManage && (
        <button
          onClick={onOpenMembers}
          className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-lg transition-all"
          style={{ background: 'var(--accent)', color: 'white' }}
        >
          👥 Manage members →
        </button>
      )}
    </div>
  )
}
