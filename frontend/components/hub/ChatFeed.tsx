'use client'
import { useState, useRef, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { useProjectMessages, usePostMessage, useDeleteMessage } from '@/lib/hooks/use-team'

interface Props {
  projectId:    number | null
  projectTitle?: string
}

function Avatar({ name, avatar }: { name: string; avatar: string | null }) {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 overflow-hidden"
      style={{ background: 'var(--accent)' }}
    >
      {avatar
        ? <img src={avatar} alt="" className="w-full h-full object-cover" />
        : name[0]?.toUpperCase()}
    </div>
  )
}

export function ChatFeed({ projectId, projectTitle }: Props) {
  const { data: messages = [], isLoading } = useProjectMessages(projectId)
  const post   = usePostMessage(projectId)
  const remove = useDeleteMessage(projectId)
  const [body, setBody]     = useState('')
  const bottomRef           = useRef<HTMLDivElement>(null)
  const inputRef            = useRef<HTMLInputElement>(null)

  // Auto-scroll to newest message whenever new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim() || post.isPending) return
    post.mutate(body.trim())
    setBody('')
    inputRef.current?.focus()
  }

  if (!projectId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ background: 'var(--bg-base)', color: 'var(--text-muted)' }}>
        <span className="text-4xl">💬</span>
        <p className="text-sm">Select a channel to start chatting</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-w-0" style={{ background: 'var(--bg-base)' }}>

      {/* Header */}
      <div
        className="px-5 py-3.5 flex items-center gap-2 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <span className="text-base font-light" style={{ color: 'var(--text-muted)' }}>#</span>
        <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          {projectTitle}
        </span>
        <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
          {messages.length} message{messages.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Message feed */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: 'var(--bg-elevated)' }} />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 rounded w-24" style={{ background: 'var(--bg-elevated)' }} />
                  <div className="h-3 rounded w-56" style={{ background: 'var(--bg-elevated)' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="text-4xl">👋</span>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              No messages yet
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Be the first to say hello to the team!
            </p>
          </div>
        )}

        {messages.map((m, i) => {
          const prev = messages[i - 1]
          const isGrouped = prev && prev.author.id === m.author.id &&
            (new Date(m.created_at).getTime() - new Date(prev.created_at).getTime()) < 5 * 60_000

          return (
            <div key={m.id} className={`flex gap-3 group ${isGrouped ? 'mt-1' : 'mt-4'}`}>
              {/* Avatar — only show on first of a group */}
              {isGrouped
                ? <div className="w-8 flex-shrink-0" />
                : <Avatar name={m.author.name} avatar={m.author.avatar} />
              }

              <div className="flex-1 min-w-0">
                {!isGrouped && (
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                      {m.author.name}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                    </span>
                  </div>
                )}

                <div className="flex items-start gap-2 group">
                  <p className="text-sm flex-1" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {m.body}
                  </p>
                  {m.is_mine && (
                    <button
                      onClick={() => remove.mutate(m.id)}
                      className="opacity-0 group-hover:opacity-100 text-[10px] px-1.5 py-0.5 rounded transition-all flex-shrink-0"
                      style={{
                        color: 'var(--text-muted)',
                        background: 'rgba(248,113,113,.1)',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#f87171' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
                    >
                      delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form onSubmit={handleSubmit} className="p-4 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex gap-2 items-center">
          <input
            ref={inputRef}
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder={`Message #${projectTitle}`}
            maxLength={2000}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
            style={{
              background: 'var(--bg-elevated)',
              border:     '1px solid var(--border)',
              color:      'var(--text-primary)',
            }}
            onFocus={e  => { e.currentTarget.style.borderColor = 'var(--accent)' }}
            onBlur={e   => { e.currentTarget.style.borderColor = 'var(--border)' }}
          />
          <button
            type="submit"
            disabled={!body.trim() || post.isPending}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
            style={{ background: 'var(--accent)', color: 'white' }}
          >
            Send
          </button>
        </div>
        {body.length > 1800 && (
          <p className="text-[10px] mt-1 text-right" style={{ color: body.length >= 2000 ? '#f87171' : 'var(--text-muted)' }}>
            {body.length}/2000
          </p>
        )}
      </form>
    </div>
  )
}
