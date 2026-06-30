'use client'
import { useState } from 'react'
import { usePermissions } from '@/lib/hooks/use-members'
import { useIsMobile } from '@/lib/hooks/use-media-query'
import { GeneralSettingsTab }       from './GeneralSettingsTab'
import { NotificationsSettingsTab } from './NotificationsSettingsTab'
import { MembersSettingsTab }       from './MembersSettingsTab'
import { DangerZoneTab }            from './DangerZoneTab'

const ALL_TABS = [
  { id: 'general',       label: 'General'       },
  { id: 'notifications', label: 'Notifications' },
  { id: 'members',       label: 'Members'       },
  { id: 'danger',        label: 'Danger Zone'   },
]

interface Props {
  project: any
  onClose: () => void
  onOpenMembers: () => void
}

export function ProjectSettingsPanel({ project, onClose, onOpenMembers }: Props) {
  const { canManage, isOwner } = usePermissions(project.id)
  const isMobile = useIsMobile()
  const [tab, setTab] = useState('general')

  // Non-managers can only see General + Notifications
  const tabs = canManage
    ? ALL_TABS
    : ALL_TABS.filter(t => t.id === 'general' || t.id === 'notifications')

  return (
    <>
      {/* Backdrop — tap to close; only needs opacity on desktop (mobile covers full screen) */}
      {!isMobile && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={onClose}
        />
      )}
      {isMobile && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className="fixed z-50 flex flex-col"
        style={isMobile ? {
          // Mobile: full screen, slides up
          inset: 0,
          background: 'var(--bg-surface)',
          animation: 'slideUpFull .25s ease',
        } : {
          // Desktop: 420px slide-in from right
          right: 0, top: 0, height: '100%', width: '420px',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border)',
          animation: 'slideInRight .22s ease',
        }}
      >
        {/* Header */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-4 md:px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="min-w-0 flex-1 pr-3">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              ⚙ Project Settings
            </h2>
            <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
              {project.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-xs transition-colors flex-shrink-0"
            style={{ background: 'var(--bg-active)', color: 'var(--text-muted)' }}
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        {/* Tab bar — scrollable so all tabs fit on narrow screens */}
        <div
          className="flex-shrink-0 flex overflow-x-auto"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          {tabs.map(t => {
            const isDanger = t.id === 'danger'
            const active   = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="px-4 py-3 text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0"
                style={{
                  borderBottom: `2px solid ${active ? (isDanger ? '#f87171' : 'var(--accent)') : 'transparent'}`,
                  color: active
                    ? (isDanger ? '#f87171' : '#a89cf5')
                    : 'var(--text-muted)',
                }}
              >
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5">
          {tab === 'general'       && <GeneralSettingsTab project={project} canEdit={canManage} />}
          {tab === 'notifications' && <NotificationsSettingsTab projectId={project.id} />}
          {tab === 'members'       && canManage && (
            <MembersSettingsTab
              projectId={project.id}
              canManage={canManage}
              onOpenMembers={onOpenMembers}
            />
          )}
          {tab === 'danger' && canManage && (
            <DangerZoneTab project={project} isOwner={isOwner} onClose={onClose} />
          )}
        </div>
      </div>
    </>
  )
}
