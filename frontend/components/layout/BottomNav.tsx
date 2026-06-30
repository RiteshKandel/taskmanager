'use client'
import { useRouter, useSearchParams } from 'next/navigation'

const ITEMS = [
  { key: 'list',     icon: '≡',  label: 'List'  },
  { key: 'kanban',   icon: '⊞',  label: 'Board' },
  { key: 'calendar', icon: '📅', label: 'Cal'   },
]

interface Props { onMore: () => void }

export function BottomNav({ onMore }: Props) {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const view         = searchParams.get('view') || 'list'

  return (
    <div
      className="flex flex-shrink-0"
      style={{
        height: '56px',
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border)',
        // Respect the iPhone home-indicator safe area
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {ITEMS.map(item => (
        <button
          key={item.key}
          onClick={() => router.replace(`?view=${item.key}`)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5"
        >
          <span style={{ fontSize: '17px', opacity: view === item.key ? 1 : 0.5 }}>
            {item.icon}
          </span>
          <span
            className="text-[9px] font-medium"
            style={{ color: view === item.key ? 'var(--accent)' : 'var(--text-muted)' }}
          >
            {item.label}
          </span>
        </button>
      ))}

      {/* "More" opens a sheet with Members + Settings */}
      <button
        onClick={onMore}
        className="flex-1 flex flex-col items-center justify-center gap-0.5"
      >
        <span style={{ fontSize: '17px', color: 'var(--text-muted)' }}>⚙</span>
        <span className="text-[9px] font-medium" style={{ color: 'var(--text-muted)' }}>
          More
        </span>
      </button>
    </div>
  )
}
