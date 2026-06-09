interface EmptyStateProps {
  icon:        string
  title:       string
  description: string
  action?:     { label: string; onClick: () => void }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-8" style={{ paddingTop: '15vh' }}>
      <div className="text-5xl mb-5 opacity-60" aria-hidden>{icon}</div>

      <h3
        className="text-base font-semibold mb-2"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h3>

      <p
        className="text-sm max-w-xs leading-relaxed mb-6"
        style={{ color: 'var(--text-muted)' }}
      >
        {description}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'var(--accent)', color: 'white' }}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
