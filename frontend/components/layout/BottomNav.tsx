'use client'
import { useRouter, useSearchParams } from 'next/navigation'

const ITEMS = [
  { key: 'list',     icon: '≡',  label: 'List'  },
  { key: 'kanban',   icon: '⊞',  label: 'Board' },
  { key: 'calendar', icon: '📅', label: 'Cal'   },
  { key: 'forum',    icon: '💬', label: 'Forum' },
]

interface Props { onForum: () => void }

export function BottomNav({ onForum }: Props) {
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
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {ITEMS.map(item => {
        const isView  = item.key !== 'forum'
        const isActive = isView ? view === item.key : false

        return (
          <button
            key={item.key}
            onClick={() =>
              isView
                ? router.replace(`?view=${item.key}`)
                : onForum()
            }
            className="flex-1 flex flex-col items-center justify-center gap-0.5"
          >
            <span style={{ fontSize: '17px', opacity: isActive || (!isView) ? 1 : 0.45 }}>
              {item.icon}
            </span>
            <span
              className="text-[9px] font-medium"
              style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}
            >
              {item.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
