'use client'
import { useMySettings, useUpdateMySettings } from '@/lib/hooks/use-project-settings'

export function NotificationsSettingsTab({ projectId }: { projectId: number }) {
  const { data: settings } = useMySettings(projectId)
  const update = useUpdateMySettings(projectId)
  const muted = settings?.notifications_muted ?? false

  return (
    <div className="space-y-4">
      <div
        className="flex items-center justify-between p-4 rounded-xl"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
      >
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Mute notifications
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Stop email notifications for this project — only affects you
          </p>
        </div>

        {/* Toggle switch */}
        <button
          onClick={() => update.mutate({ notifications_muted: !muted })}
          disabled={update.isPending}
          aria-label={muted ? 'Unmute notifications' : 'Mute notifications'}
          className="relative flex-shrink-0 w-10 h-5 rounded-full transition-colors duration-200"
          style={{ background: muted ? 'var(--accent)' : 'var(--bg-active)', border: '1px solid var(--border)' }}
        >
          <span
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow-sm"
            style={{ left: muted ? 'calc(100% - 18px)' : '2px' }}
          />
        </button>
      </div>

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        💡 Global notification preferences (e.g., task reminders) are in your account settings.
      </p>
    </div>
  )
}
