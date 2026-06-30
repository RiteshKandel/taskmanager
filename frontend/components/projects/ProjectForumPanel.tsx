'use client'
import { ForumFeed }           from '@/components/hub/ForumFeed'
import { ForumComposer }       from '@/components/hub/ForumComposer'
import { MemberProjectMatrix } from '@/components/hub/MemberProjectMatrix'
import { useIsMobile }         from '@/lib/hooks/use-media-query'

interface Props {
  projectId: number
  projectTitle?: string
  onClose: () => void
}

export function ProjectForumPanel({ projectId, projectTitle, onClose }: Props) {
  const isMobile = useIsMobile()

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.45)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed z-50 flex"
        style={isMobile ? {
          // Mobile: full screen
          inset: 0,
          background: 'var(--bg-surface)',
          animation: 'slideUpFull .25s ease',
          flexDirection: 'column',
        } : {
          // Desktop: 740px from the right
          right: 0, top: 0, height: '100%', width: '740px',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border)',
          animation: 'slideInRight .25s ease',
        }}
      >
        {/* ── Left: Forum feed + composer ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <div
            className="flex-shrink-0 flex items-center justify-between px-4 md:px-5 py-4"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                style={{
                  background: 'rgba(124,106,240,.1)',
                  border: '1px solid rgba(124,106,240,.2)',
                }}
              >
                💬
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Project Forum
                </h2>
                {projectTitle && (
                  <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                    {projectTitle}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-xs transition-colors flex-shrink-0 ml-2"
              style={{ background: 'var(--bg-active)', color: 'var(--text-muted)' }}
              aria-label="Close forum"
            >
              ✕
            </button>
          </div>

          {/* Feed — scrollable */}
          <div className="flex-1 overflow-y-auto">
            <ForumFeed projectId={projectId} />
          </div>

          {/* Composer — pinned to bottom */}
          <div
            className="flex-shrink-0 p-3 md:p-4"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <ForumComposer projectId={projectId} />
          </div>
        </div>

        {/* ── Right: Contributor map — desktop only ── */}
        {!isMobile && (
          <div
            className="w-[320px] flex-shrink-0 flex flex-col overflow-hidden"
            style={{ borderLeft: '1px solid var(--border)' }}
          >
            {/* Header */}
            <div
              className="flex-shrink-0 px-4 py-4 flex items-center gap-2.5"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                style={{
                  background: 'rgba(52,211,153,.1)',
                  border: '1px solid rgba(52,211,153,.2)',
                }}
              >
                👥
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Contributor Map
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Project members
                </p>
              </div>
            </div>

            {/* Matrix — scrollable */}
            <div className="flex-1 overflow-y-auto">
              <MemberProjectMatrix projectId={projectId} />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
