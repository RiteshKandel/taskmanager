'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useCreateForumPost, useMemberMatrix } from '@/lib/hooks/use-forum'
import type { MatrixUser } from '@/lib/hooks/use-forum'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

type Suggestion = {
  type: 'mention' | 'project'
  id: number
  label: string
  color?: string
}

export function ForumComposer({ projectId }: { projectId?: number }) {
  const [content, setContent] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [triggerStart, setTriggerStart] = useState<number | null>(null)
  const [triggerType, setTriggerType] = useState<'@' | '#' | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const createPost = useCreateForumPost(projectId)

  // Data sources for autocomplete
  const { data: matrixUsers = [] } = useMemberMatrix(projectId)
  const { data: flatProjects = [] } = useQuery({
    queryKey: ['projects-flat-all', projectId ?? 'global'],
    queryFn: () => {
      const params = projectId ? { root_id: projectId } : {}
      return api.get('/projects/flat/', { params }).then(r => r.data)
    },
  })

  const handleInput = useCallback((value: string) => {
    setContent(value)

    const textarea = textareaRef.current
    if (!textarea) return
    const cursor = textarea.selectionStart

    // Find the last trigger character before the cursor
    const textBefore = value.slice(0, cursor)
    const lastAt = textBefore.lastIndexOf('@')
    const lastHash = textBefore.lastIndexOf('#')

    // Determine which trigger is more recent
    const triggerPos = Math.max(lastAt, lastHash)
    const currentTrigger = triggerPos === lastAt ? '@' : '#'

    if (triggerPos >= 0) {
      // Check there's no space before the trigger (or it's at position 0)
      const charBefore = triggerPos > 0 ? value[triggerPos - 1] : ' '
      if (charBefore === ' ' || charBefore === '\n' || triggerPos === 0) {
        const query = textBefore.slice(triggerPos + 1).toLowerCase()

        // Don't show suggestions if there's a space after more than 2 words
        if (query.split(' ').length <= 2) {
          let results: Suggestion[] = []

          if (currentTrigger === '@') {
            results = matrixUsers
              .filter((u: MatrixUser) => u.name.toLowerCase().includes(query))
              .slice(0, 6)
              .map((u: MatrixUser) => ({ type: 'mention' as const, id: u.id, label: u.name }))
          } else {
            results = flatProjects
              .filter((p: any) => p.title.toLowerCase().includes(query))
              .slice(0, 6)
              .map((p: any) => ({ type: 'project' as const, id: p.id, label: p.title, color: p.color }))
          }

          if (results.length > 0) {
            setSuggestions(results)
            setShowSuggestions(true)
            setSelectedIdx(0)
            setTriggerStart(triggerPos)
            setTriggerType(currentTrigger)
            return
          }
        }
      }
    }

    setShowSuggestions(false)
    setSuggestions([])
  }, [matrixUsers, flatProjects])

  const insertSuggestion = useCallback((suggestion: Suggestion) => {
    if (triggerStart === null || triggerType === null) return

    const textarea = textareaRef.current
    if (!textarea) return

    const before = content.slice(0, triggerStart)
    const after = content.slice(textarea.selectionStart)
    const insert = `${triggerType}${suggestion.label} `

    const newContent = before + insert + after
    setContent(newContent)
    setShowSuggestions(false)
    setSuggestions([])

    // Restore cursor position after React re-render
    setTimeout(() => {
      const newPos = triggerStart + insert.length
      textarea.focus()
      textarea.setSelectionRange(newPos, newPos)
    }, 0)
  }, [content, triggerStart, triggerType])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIdx(i => (i + 1) % suggestions.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIdx(i => (i - 1 + suggestions.length) % suggestions.length)
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        insertSuggestion(suggestions[selectedIdx])
        return
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false)
        return
      }
    }

    // Ctrl+Enter to submit
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleSubmit = () => {
    const trimmed = content.trim()
    if (!trimmed || createPost.isPending) return
    createPost.mutate(trimmed, {
      onSuccess: () => setContent(''),
    })
  }

  return (
    <div className="relative">
      {/* Suggestion dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          className="absolute bottom-full left-0 right-0 mb-2 rounded-xl overflow-hidden shadow-xl z-50"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
          }}
        >
          {suggestions.map((s, i) => (
            <button
              key={`${s.type}-${s.id}`}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-all"
              style={{
                background: i === selectedIdx ? 'var(--bg-active)' : 'transparent',
                color: 'var(--text-primary)',
              }}
              onMouseEnter={() => setSelectedIdx(i)}
              onMouseDown={(e) => {
                e.preventDefault()
                insertSuggestion(s)
              }}
            >
              {s.type === 'mention' ? (
                <>
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, var(--accent), #a78bfa)' }}
                  >
                    {s.label.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </span>
                  <span className="truncate">{s.label}</span>
                  <span className="ml-auto text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    @mention
                  </span>
                </>
              ) : (
                <>
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: s.color || 'var(--accent)' }}
                  />
                  <span className="truncate">{s.label}</span>
                  <span className="ml-auto text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    #project
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Compose area */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
        }}
      >
        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write an update… Use @name to mention, #project to reference"
          rows={3}
          maxLength={2000}
          className="w-full resize-none text-sm p-3 outline-none"
          style={{
            background: 'transparent',
            color: 'var(--text-primary)',
          }}
        />
        <div
          className="flex items-center justify-between px-3 py-2"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {content.length}/2000
            </span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Ctrl + Enter to send
            </span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || createPost.isPending}
            className="text-xs font-semibold px-4 py-1.5 rounded-lg transition-all disabled:opacity-40"
            style={{ background: 'var(--accent)', color: 'white' }}
          >
            {createPost.isPending ? '⟳ Posting…' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  )
}
