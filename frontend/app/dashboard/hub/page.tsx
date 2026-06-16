'use client'
import { useState, useMemo } from 'react'
import { useTeamOverview, groupProjectsFromMembers } from '@/lib/hooks/use-team'
import { ChannelList }   from '@/components/hub/ChannelList'
import { ChatFeed }      from '@/components/hub/ChatFeed'
import { ActivityBoard } from '@/components/hub/ActivityBoard'

export default function TeamHubPage() {
  const { data: members = [], isLoading } = useTeamOverview()
  const [activeChannel, setActiveChannel] = useState<number | null>(null)

  const channels = useMemo(() => groupProjectsFromMembers(members), [members])

  // Auto-select the first channel once data loads
  const effectiveChannel = useMemo(() => {
    if (activeChannel) return activeChannel
    return channels[0]?.id ?? null
  }, [activeChannel, channels])

  const activeProject = channels.find(c => c.id === effectiveChannel)

  if (isLoading) {
    return (
      <div
        className="h-full flex items-center justify-center gap-3"
        style={{ background: 'var(--bg-base)', color: 'var(--text-muted)' }}
      >
        <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        <span className="text-sm">Loading team hub…</span>
      </div>
    )
  }

  return (
    <div className="h-full flex overflow-hidden">
      <ChannelList
        members={members}
        activeId={effectiveChannel}
        onSelect={setActiveChannel}
      />
      <ChatFeed
        projectId={effectiveChannel}
        projectTitle={activeProject?.title}
      />
      <ActivityBoard members={members} />
    </div>
  )
}
