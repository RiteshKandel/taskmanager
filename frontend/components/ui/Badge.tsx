const PRIORITY: Record<number, { label: string; color: string; dot: string }> = {
  0: { label: '',       color: '',                                                    dot: 'var(--text-muted)' },
  1: { label: 'Low',    color: 'rgba(96,165,250,.1)',                                 dot: '#60a5fa' },
  2: { label: 'Medium', color: 'rgba(251,191,36,.1)',                                 dot: '#fbbf24' },
  3: { label: 'High',   color: 'rgba(251,146,60,.1)',                                 dot: '#fb923c' },
  4: { label: 'Urgent', color: 'rgba(248,113,113,.1)',                                dot: '#f87171' },
}

const PRIORITY_TEXT: Record<number, string> = {
  0: '',
  1: '#60a5fa',
  2: '#fbbf24',
  3: '#fb923c',
  4: '#f87171',
}

const STATUS: Record<string, { label: string; bg: string; text: string }> = {
  todo:        { label: 'To Do',       bg: 'var(--bg-active)',          text: 'var(--text-muted)' },
  in_progress: { label: 'In Progress', bg: 'rgba(124,106,240,.15)',    text: '#c4b5fd' },
  done:        { label: 'Done',        bg: 'rgba(52,211,153,.1)',      text: '#34d399' },
}

export function PriorityDot({ priority }: { priority: number }) {
  const p = PRIORITY[priority] || PRIORITY[0]
  return (
    <span
      className="flex-shrink-0"
      style={{
        width: '6px',
        height: '6px',
        borderRadius: '9999px',
        background: p.dot,
      }}
    />
  )
}

export function PriorityBadge({ priority }: { priority: number }) {
  const p = PRIORITY[priority] || PRIORITY[0]
  if (!p.label) return null
  return (
    <span
      className="tag"
      style={{ background: p.color, color: PRIORITY_TEXT[priority] }}
    >
      {p.label}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] || STATUS.todo
  return (
    <span className="tag" style={{ background: s.bg, color: s.text }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '9999px', background: 'currentColor' }} />
      {s.label}
    </span>
  )
}
