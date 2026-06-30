'use client'
import { ForumFeed } from '@/components/hub/ForumFeed'
import { ForumComposer } from '@/components/hub/ForumComposer'
import { MemberProjectMatrix } from '@/components/hub/MemberProjectMatrix'

export default function HubPage() {
  return (
    <div className="flex h-full overflow-hidden flex-col md:flex-row">

      {/* ──── Left/Top Panel: Forum ──── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div
          className="flex-shrink-0 px-4 md:px-6 py-4 flex items-center gap-3"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
            style={{
              background: 'rgba(124,106,240,.1)',
              border: '1px solid rgba(124,106,240,.2)',
            }}
          >
            💬
          </div>
          <div>
            <h1 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              General Forum
            </h1>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Share updates, tag @members, reference #projects
            </p>
          </div>
        </div>

        {/* Feed area — scrollable */}
        <div className="flex-1 overflow-y-auto">
          <ForumFeed />
        </div>

        {/* Composer — pinned to bottom */}
        <div className="flex-shrink-0 p-3 md:p-4" style={{ borderTop: '1px solid var(--border)' }}>
          <ForumComposer />
        </div>
      </div>

      {/* ──── Right Panel: Member-Project Matrix — hidden on mobile ──── */}
      <div
        className="hidden md:flex w-[340px] flex-shrink-0 flex-col overflow-hidden"
        style={{ borderLeft: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div
          className="flex-shrink-0 px-5 py-4 flex items-center gap-3"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
            style={{
              background: 'rgba(52,211,153,.1)',
              border: '1px solid rgba(52,211,153,.2)',
            }}
          >
            👥
          </div>
          <div>
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Contributor Map
            </h2>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Project Contributors
            </p>
          </div>
        </div>

        {/* Matrix area — scrollable */}
        <div className="flex-1 overflow-y-auto">
          <MemberProjectMatrix />
        </div>
      </div>
    </div>
  )
}
