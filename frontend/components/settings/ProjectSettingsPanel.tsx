'use client'
import { useState } from 'react'
import { usePermissions } from '@/lib/hooks/use-members'
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
  const [tab, setTab] = useState('general')

  // Non-managers can only see General + Notifications
  const tabs = canManage
    ? ALL_TABS
    : ALL_TABS.filter(t => t.id === 'general' || t.id === 'notifications')

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.45)' }}
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div
        className="fixed right-0 top-0 h-full z-50 flex flex-col"
        style={{
          width: '420px',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border)',
          animation: 'slideInRight .22s ease',
        }}
      >
        {/* Header */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              ⚙ Project Settings
            </h2>
            <p className="text-[11px] mt-0.5 truncate max-w-[300px]" style={{ color: 'var(--text-muted)' }}>
              {project.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-xs transition-colors"
            style={{ background: 'var(--bg-active)', color: 'var(--text-muted)' }}
          >
            ✕
          </button>
        </div>

        {/* Tab bar */}
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
                className="px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors"
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
        <div className="flex-1 overflow-y-auto p-5">
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
