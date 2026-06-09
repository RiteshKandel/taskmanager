'use client'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import api from '@/lib/api'

export function TaskActivity({ taskId }: { taskId: number }) {
  const { data: logs = [] } = useQuery({
    queryKey: ['activity', taskId],
    queryFn:  () => api.get(`/tasks/${taskId}/activity/`).then(r => Array.isArray(r.data) ? r.data : (r.data.results ?? [])),
  })

  if (logs.length === 0) return (
    <p className="text-xs text-center py-6" style={{ color:'var(--text-muted)' }}>No activity yet</p>
  )

  return (
    <div className="space-y-1">
      {logs.map((l: any) => (
        <div key={l.id} className="flex gap-3 py-2"
          style={{ borderBottom:'1px solid rgba(255,255,255,.03)' }}>
          <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
            style={{ background:'var(--text-muted)' }} />
          <div className="flex-1">
            <p className="text-xs" style={{ color:'var(--text-secondary)' }}>
              <strong style={{ color:'var(--text-primary)' }}>{l.actor_name}</strong>
              {' '}{l.action.toLowerCase()}
              {l.detail && <span style={{ color:'var(--text-muted)' }}> · {l.detail}</span>}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color:'var(--text-muted)' }}>
              {formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
