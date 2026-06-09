export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 p-8">
      <div className="text-3xl">⚠️</div>
      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        Failed to load
      </p>
      <p className="text-xs text-center max-w-xs" style={{ color: 'var(--text-muted)' }}>
        Check your connection and try again.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-medium px-4 py-2 rounded-lg mt-1 transition-colors"
          style={{
            background: 'var(--bg-elevated)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
          }}
        >
          ↺ Retry
        </button>
      )}
    </div>
  )
}
