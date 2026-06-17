'use client'
import { useForumPosts, useDeleteForumPost } from '@/lib/hooks/use-forum'
import type { ForumPost } from '@/lib/hooks/use-forum'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const seconds = Math.floor((now - then) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Renders content with @mentions highlighted as chips and #project as badges.
 */
function RichContent({ content, mentionIds }: { content: string; mentionIds: number[] }) {
  // Split on @word or #word patterns
  const parts = content.split(/(@[\w]+(?:\s[\w]+)?|#[\w]+(?:\s[\w]+)?)/g)
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('@')) {
          return (
            <span
              key={i}
              className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-semibold mx-0.5"
              style={{
                background: 'rgba(124,106,240,.15)',
                color: '#a89cf5',
              }}
            >
              {part}
            </span>
          )
        }
        if (part.startsWith('#')) {
          return (
            <span
              key={i}
              className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-semibold mx-0.5"
              style={{
                background: 'rgba(52,211,153,.12)',
                color: '#34d399',
              }}
            >
              {part}
            </span>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </span>
  )
}

export function ForumFeed() {
  const { user } = useAuth()
  const router = useRouter()
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useForumPosts()
  const deletePost = useDeleteForumPost()

  const allPosts: ForumPost[] = data?.pages?.flatMap((p: any) => p.results || []) || []

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[1,2,3].map(i => (
          <div key={i} className="animate-pulse rounded-xl p-4" style={{ background: 'var(--bg-elevated)' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full" style={{ background: 'var(--bg-active)' }} />
              <div className="h-3 w-24 rounded" style={{ background: 'var(--bg-active)' }} />
            </div>
            <div className="h-3 w-full rounded mb-2" style={{ background: 'var(--bg-active)' }} />
            <div className="h-3 w-3/4 rounded" style={{ background: 'var(--bg-active)' }} />
          </div>
        ))}
      </div>
    )
  }

  if (allPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8">
        <div className="text-4xl mb-4">💬</div>
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          No posts yet
        </p>
        <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          Start a conversation! Share updates, mention team members with @name, or reference projects with #project.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1 p-3">
      {allPosts.map(post => {
        const initials = post.author.name
          ?.split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2) || '?'
        const isOwn = post.author.id === user?.id

        return (
          <div
            key={post.id}
            className="group rounded-xl px-4 py-3 transition-all"
            style={{ background: 'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              {post.author.avatar_url ? (
                <img
                  src={post.author.avatar_url}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                  style={{ background: 'linear-gradient(135deg, var(--accent), #a78bfa)' }}
                >
                  {initials}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {post.author.name}
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {timeAgo(post.created_at)}
                  </span>

                  {/* Delete button — only for own posts */}
                  {isOwn && (
                    <button
                      onClick={() => deletePost.mutate(post.id)}
                      className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-0.5 rounded-md"
                      style={{ color: '#f87171', background: 'rgba(248,113,113,.08)' }}
                      title="Delete post"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  <RichContent content={post.content} mentionIds={post.mention_ids} />
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {/* Load more */}
      {hasNextPage && (
        <div className="flex justify-center pt-4 pb-2">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="text-xs font-semibold px-4 py-2 rounded-xl transition-all disabled:opacity-50"
            style={{
              background: 'var(--bg-active)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            {isFetchingNextPage ? '⟳ Loading…' : 'Load older posts'}
          </button>
        </div>
      )}
    </div>
  )
}
