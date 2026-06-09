'use client'
import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import api from '@/lib/api'
import { notify } from '@/lib/toast'
import { useAuth } from '@/lib/auth-context'

interface Props { taskId: number }

export function TaskComments({ taskId }: Props) {
  const { user }   = useAuth()
  const qc         = useQueryClient()
  const [body, setBody] = useState('')
  const [editing, setEditing] = useState<{ id: number; body: string } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', taskId],
    queryFn:  () => api.get(`/tasks/${taskId}/comments/`).then(r => Array.isArray(r.data) ? r.data : (r.data.results ?? [])),
  })

  const create = useMutation({
    mutationFn: (body: string) =>
      api.post(`/tasks/${taskId}/comments/`, { body }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', taskId] })
      setBody('')
    },
    onError: () => notify.error('Failed to post comment'),
  })

  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: string }) =>
      api.patch(`/tasks/${taskId}/comments/${id}/`, { body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', taskId] })
      setEditing(null)
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/tasks/${taskId}/comments/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', taskId] }),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    create.mutate(body)
  }

  const initials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)

  return (
    <div className="space-y-4">
      {comments.length === 0 && (
        <p className="text-xs text-center py-4" style={{ color:'var(--text-muted)' }}>
          No comments yet. Be the first.
        </p>
      )}

      {comments.map((c: any) => (
        <div key={c.id} className="flex gap-3">
          {/* Avatar */}
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
            style={{ background:'var(--accent)' }}>
            {initials(c.author.name || '?')}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold" style={{ color:'var(--text-primary)' }}>
                {c.author.name}
              </span>
              <span className="text-[10px]" style={{ color:'var(--text-muted)' }}>
                {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
              </span>
              {c.is_mine && (
                <div className="ml-auto flex gap-2">
                  <button onClick={() => setEditing({ id: c.id, body: c.body })}
                    className="text-[10px] transition-colors"
                    style={{ color:'var(--text-muted)' }}>Edit</button>
                  <button onClick={() => remove.mutate(c.id)}
                    className="text-[10px] transition-colors"
                    style={{ color:'var(--text-muted)' }}>Delete</button>
                </div>
              )}
            </div>

            {editing?.id === c.id ? (
              <div className="space-y-2">
                <textarea value={editing!.body} rows={2}
                  onChange={e => setEditing({ ...editing!, body: e.target.value })}
                  className="w-full rounded-lg p-2 text-xs resize-none outline-none"
                  style={{ background:'var(--bg-active)', border:'1px solid var(--border)', color:'var(--text-primary)' }} />
                <div className="flex gap-2">
                  <button onClick={() => update.mutate(editing!)}
                    className="text-[10px] font-medium px-3 py-1 rounded-md"
                    style={{ background:'var(--accent)', color:'white' }}>Save</button>
                  <button onClick={() => setEditing(null)}
                    className="text-[10px] font-medium px-3 py-1 rounded-md"
                    style={{ background:'var(--bg-active)', color:'var(--text-muted)' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <p className="text-xs leading-relaxed whitespace-pre-wrap"
                style={{ color:'var(--text-secondary)' }}>{c.body}</p>
            )}
          </div>
        </div>
      ))}

      {/* New comment input */}
      <form onSubmit={handleSubmit} className="flex gap-2.5 pt-2"
        style={{ borderTop:'1px solid var(--border)' }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
          style={{ background:'var(--accent)' }}>
          {initials(user?.name || '?')}
        </div>
        <div className="flex-1">
          <textarea ref={textareaRef} value={body}
            onChange={e => setBody(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSubmit(e as any) } }}
            rows={2} placeholder="Add a comment… Cmd+Enter to send"
            className="w-full rounded-lg p-2.5 text-xs resize-none outline-none transition-all"
            style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', color:'var(--text-primary)' }}
            onFocus={e => e.target.style.borderColor='var(--accent)'}
            onBlur={e => e.target.style.borderColor='var(--border)'} />
          {body.trim() && (
            <button type="submit" disabled={create.isPending}
              className="mt-1.5 text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-50"
              style={{ background:'var(--accent)', color:'white' }}>
              {create.isPending ? 'Posting…' : 'Post comment'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
