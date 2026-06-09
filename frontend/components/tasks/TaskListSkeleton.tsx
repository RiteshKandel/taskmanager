import { Skeleton } from '@/components/ui/Skeleton'

// ── Single task row skeleton — mirrors exact layout of a real TaskRow ──
function TaskRowSkeleton({ width = '60%' }: { width?: string }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5">
      <Skeleton className="w-4 h-4 rounded" style={{ flexShrink: 0 }} />
      <Skeleton className="w-1.5 h-1.5 rounded-full" style={{ flexShrink: 0 }} />
      <Skeleton className="h-3" style={{ width, borderRadius: '4px' }} />
    </div>
  )
}

// ── Full task list skeleton with group headers ──
export function TaskListSkeleton() {
  return (
    <div className="p-6 space-y-1">
      {/* Fake add-task bar */}
      <Skeleton className="h-10 rounded-lg mb-5" />

      {/* Group header */}
      <div className="flex items-center gap-3 mb-2">
        <Skeleton className="h-2.5 w-20 rounded-full" />
        <Skeleton className="h-px flex-1" />
      </div>

      <TaskRowSkeleton width="70%" />
      <TaskRowSkeleton width="50%" />
      <TaskRowSkeleton width="80%" />

      <div className="flex items-center gap-3 mt-4 mb-2">
        <Skeleton className="h-2.5 w-14 rounded-full" />
        <Skeleton className="h-px flex-1" />
      </div>

      <TaskRowSkeleton width="45%" />
      <TaskRowSkeleton width="65%" />
    </div>
  )
}

// ── Kanban board skeleton — 3 columns with cards ──
export function KanbanSkeleton() {
  return (
    <div className="flex gap-4 p-6">
      {[3, 2, 4].map((count, ci) => (
        <div key={ci} className="w-72 flex-shrink-0">
          <Skeleton className="h-5 w-28 rounded-full mb-3" />
          <div
            className="space-y-2 p-2 rounded-xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            {Array.from({ length: count }).map((_, i) => (
              <div
                key={i}
                className="p-3 rounded-lg"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
              >
                <Skeleton className="h-3 w-3/4 rounded mb-2" />
                <Skeleton className="h-2.5 w-1/2 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Sidebar project tree skeleton ──
export function SidebarSkeleton() {
  return (
    <div className="px-2 space-y-1">
      {['60%', '80%', '70%', '50%', '75%'].map((w, i) => (
        <div key={i} className="flex items-center gap-2 px-3 py-2">
          <Skeleton className="w-2 h-2 rounded-full" style={{ flexShrink: 0 }} />
          <Skeleton className="h-3 rounded" style={{ width: w }} />
        </div>
      ))}
    </div>
  )
}

// ── Project topbar skeleton ──
export function TopbarSkeleton() {
  return (
    <div
      className="flex items-center gap-3 px-6 flex-shrink-0"
      style={{
        height: '52px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-surface)',
      }}
    >
      <Skeleton className="w-2.5 h-2.5 rounded-full" />
      <Skeleton className="h-4 w-36 rounded" />
      <div className="flex-1" />
      <Skeleton className="h-7 w-16 rounded-md" />
      <Skeleton className="h-7 w-36 rounded-md" />
    </div>
  )
}
