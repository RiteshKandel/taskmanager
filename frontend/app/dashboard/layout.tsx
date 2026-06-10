'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useProjectTree } from '@/lib/hooks/use-projects'
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts'
import { ProjectTreeItem } from '@/components/projects/ProjectTreeItem'
import { NewProjectModal } from '@/components/projects/NewProjectModal'
import { CommandPalette } from '@/components/search/CommandPalette'
import { SidebarSkeleton } from '@/components/tasks/TaskListSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout }      = useAuth()
  const { data: tree = [], isLoading } = useProjectTree()
  const pathname              = usePathname()
  const [modalParent, setModalParent] = useState<number | null>(null)
  const [modalOpen, setModalOpen]     = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  // Ctrl+K opens the command palette from anywhere in the dashboard
  useKeyboardShortcuts({
    'ctrl+k': () => setPaletteOpen(p => !p),
  })

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>

      {/* ──── Sidebar ──── */}
      <aside
        className="w-[220px] flex-shrink-0 flex flex-col"
        style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}
      >
        {/* Logo */}
        <div
          className="px-4 py-4 flex items-center gap-2.5"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div
            className="w-7 h-7 rounded-[14px] flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--accent), #a78bfa)',
              boxShadow: '0 2px 8px var(--accent-glow)',
            }}
          >
            T
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Task Manager
            </p>
            <p className="text-xs truncate max-w-[140px]" style={{ color: 'var(--text-secondary)' }}>
              {user?.email}
            </p>
          </div>
        </div>

        {/* Search button */}
        <div className="px-2 pt-2.5 pb-1">
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-left transition-all"
            style={{
              background: 'var(--bg-elevated)',
              border:     '1px solid var(--border)',
              color:      'var(--text-muted)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(124,106,240,.35)'
              e.currentTarget.style.background  = 'var(--bg-active)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.background  = 'var(--bg-elevated)'
            }}
          >
            <span className="text-sm">🔍</span>
            <span className="flex-1 text-xs" style={{ color: 'var(--text-muted)' }}>Search…</span>
            <kbd
              className="text-[9px] font-mono px-1.5 py-0.5 rounded"
              style={{
                background: 'var(--bg-active)',
                color:      'var(--text-muted)',
                border:     '1px solid var(--border-strong)',
              }}
            >
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Nav */}
        <div className="px-2 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
          <SidebarLink href="/dashboard" active={pathname === '/dashboard'}>
            <span className="text-sm">⬡</span> Overview
          </SidebarLink>
        </div>

        {/* Projects tree */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <span className="section-label">
              Projects
            </span>
            <button
              onClick={() => { setModalParent(null); setModalOpen(true) }}
              className="w-5 h-5 flex items-center justify-center rounded text-sm transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              +
            </button>
          </div>

          <div className="px-2 pb-4">
            {isLoading ? (
              <SidebarSkeleton />
            ) : tree.length === 0 ? (
              <EmptyState
                icon="📁"
                title="No projects yet"
                description="Create your first project to get started."
                action={{ label: '+ Create project', onClick: () => { setModalParent(null); setModalOpen(true) } }}
              />
            ) : (
              tree.filter((p: any) => !p.is_archived).map((p: any) => (
                <ProjectTreeItem
                  key={p.id}
                  project={p}
                  depth={0}
                  onNewSubproject={id => { setModalParent(id); setModalOpen(true) }}
                />
              ))
            )}
          </div>
        </div>

        {/* User footer */}
        <div className="p-2" style={{ borderTop: '1px solid var(--border)' }}>
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2.5 px-3 py-2 rounded-[14px] transition-colors mb-1 text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span className="text-base">⚙</span>
            <span>Settings</span>
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[14px] transition-colors text-left"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="avatar"
                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--accent), #a78bfa)' }}
              >
                {initials}
              </div>
            )}
            <span className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{user?.name}</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden">{children}</main>

      {modalOpen && (
        <NewProjectModal
          defaultParentId={modalParent}
          onClose={() => setModalOpen(false)}
        />
      )}

      {/* Command palette — rendered at root level so it overlays everything */}
      {paletteOpen && (
        <CommandPalette onClose={() => setPaletteOpen(false)} />
      )}
    </div>
  )
}

function SidebarLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2 rounded-[14px] text-sm transition-all"
      style={{
        background: active ? 'var(--accent-dim)' : 'transparent',
        color: active ? '#a89cf5' : 'var(--text-secondary)',
      }}
    >
      {children}
    </Link>
  )
}