'use client'
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns'
import { Views } from 'react-big-calendar'

const VIEW_LABELS: Record<string, string> = {
  [Views.MONTH]: 'Month',
  [Views.WEEK]:  'Week',
  [Views.DAY]:   'Day',
}

interface Props {
  date:           Date
  view:           string
  onNavigate:     (date: Date) => void
  onView:         (view: string) => void
  availableViews?: string[]   // defaults to all three
}

export function CalendarToolbar({
  date, view, onNavigate, onView,
  availableViews = [Views.MONTH, Views.WEEK, Views.DAY],
}: Props) {
  const goBack = () => {
    if (view === Views.MONTH) onNavigate(subMonths(date, 1))
    else if (view === Views.WEEK)  onNavigate(subWeeks(date,  1))
    else                           onNavigate(subDays(date,   1))
  }
  const goForward = () => {
    if (view === Views.MONTH) onNavigate(addMonths(date, 1))
    else if (view === Views.WEEK)  onNavigate(addWeeks(date,  1))
    else                           onNavigate(addDays(date,   1))
  }

  // Format the title based on current view
  const titleFmt = view === Views.MONTH ? 'MMMM yyyy'
                 : view === Views.DAY   ? 'EEEE, MMMM d yyyy'
                 :                        'MMMM yyyy'

  return (
    <div className="flex items-center gap-3 px-3 md:px-5 py-3 flex-shrink-0"
      style={{ borderBottom: '1px solid var(--border)' }}>

      {/* Date title */}
      <h2 className="text-sm font-semibold flex-1 truncate"
        style={{ color: 'var(--text-primary)' }}>
        {format(date, titleFmt)}
      </h2>

      {/* Nav buttons */}
      <div className="flex items-center gap-1">
        <button onClick={goBack}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-sm transition-colors"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                   color: 'var(--text-secondary)' }}>‹</button>

        <button onClick={() => onNavigate(new Date())}
          className="px-3 h-7 text-xs font-medium rounded-lg transition-colors"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                   color: 'var(--text-secondary)' }}>Today</button>

        <button onClick={goForward}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-sm transition-colors"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                   color: 'var(--text-secondary)' }}>›</button>
      </div>

      {/* View switcher — only renders the views passed via availableViews */}
      <div className="flex overflow-hidden rounded-lg"
        style={{ border: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
        {availableViews.map(v => (
          <button key={v} onClick={() => onView(v)}
            className="px-3 h-7 text-xs font-medium transition-all"
            style={{
              background: view === v ? 'var(--accent-dim)' : 'transparent',
              color:      view === v ? '#a89cf5'            : 'var(--text-muted)',
            }}>
            {VIEW_LABELS[v]}
          </button>
        ))}
      </div>
    </div>
  )
}
