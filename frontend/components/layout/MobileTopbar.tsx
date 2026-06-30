'use client'

interface Props { onMenuClick: () => void }

export function MobileTopbar({ onMenuClick }: Props) {
  return (
    <div
      className="flex items-center gap-3 px-3 flex-shrink-0"
      style={{
        height: '48px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Hamburger — 44px tap target per iOS/Android touch guidelines */}
      <button
        onClick={onMenuClick}
        className="w-11 h-11 -ml-2 flex items-center justify-center rounded-lg flex-shrink-0"
        style={{ color: 'var(--text-secondary)' }}
        aria-label="Open menu"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M3 5h14M3 10h14M3 15h14"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <div
        className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
        style={{ background: 'linear-gradient(135deg,var(--accent),#a78bfa)' }}
      >
        T
      </div>
      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
        Task Manager
      </span>
    </div>
  )
}
