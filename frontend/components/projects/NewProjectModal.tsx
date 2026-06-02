'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateProject, useProjectsFlat } from '@/lib/hooks/use-projects'
import type { ProjectFlat } from '@/lib/hooks/use-projects'
import { ColorPicker } from '@/components/ui/ColorPicker'

interface Props {
  defaultParentId?: number | null
  onClose: () => void
}

export function NewProjectModal({ defaultParentId = null, onClose }: Props) {
  const router        = useRouter()
  const createProject = useCreateProject()

  const [title, setTitle]           = useState('')
  const [color, setColor]           = useState('#7c6af0')
  const [parentId, setParentId]     = useState<number | null>(defaultParentId)
  const [search, setSearch]         = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)

  const debounceRef  = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const dropdownRef  = useRef<HTMLDivElement>(null)

  // Debounce the search input
  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(debounceRef.current)
  }, [search])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close modal on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const { data: suggestions = [] } = useProjectsFlat(debouncedSearch)

  const handleSelectParent = (p: ProjectFlat) => {
    setParentId(p.id)
    setSearch(p.path)
    setShowDropdown(false)
  }

  const handleClearParent = () => {
    setParentId(null)
    setSearch('')
    setDebouncedSearch('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required.'); return }
    setError('')
    setLoading(true)
    try {
      const project = await createProject.mutateAsync({
        title: title.trim(),
        color,
        parent: parentId,
      })
      onClose()
      router.push(`/dashboard/projects/${project.id}`)
    } catch (err: any) {
      setError(
        err.response?.data?.title?.[0] ||
        err.response?.data?.parent?.[0] ||
        'Failed to create project.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.6)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-[20px]"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 25px 50px rgba(0,0,0,.5)',
          animation: 'scaleIn .2s ease',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="p-7">
          <h2
            id="modal-title"
            className="font-bold text-xl mb-6"
            style={{ color: 'var(--text-primary)' }}
          >
            New project
          </h2>

          {error && (
            <div
              className="text-sm p-3 rounded-[10px] mb-4"
              style={{
                background: 'rgba(248,113,113,.1)',
                border: '1px solid rgba(248,113,113,.2)',
                color: '#f87171',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label
                className="block font-semibold text-sm mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Title
              </label>
              <input
                autoFocus
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="The project's title goes here…"
                className="input-base"
              />
            </div>

            {/* Parent project search */}
            <div ref={dropdownRef} className="relative">
              <label
                className="block font-semibold text-sm mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Parent Project
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value)
                    setParentId(null)
                    setShowDropdown(true)
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Type to search for a project…"
                  className="input-base pr-10"
                />
                {(parentId !== null || search) && (
                  <button
                    type="button"
                    onClick={handleClearParent}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xl leading-none transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                    aria-label="Clear parent"
                  >
                    ×
                  </button>
                )}
              </div>

              {showDropdown && suggestions.length > 0 && (
                <div
                  className="absolute z-10 w-full mt-1 rounded-[14px] overflow-hidden max-h-44 overflow-y-auto"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    boxShadow: '0 8px 24px rgba(0,0,0,.4)',
                  }}
                >
                  {suggestions.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectParent(p)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: p.color }}
                      />
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {p.title}
                        </p>
                        {p.path !== p.title && (
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {p.path}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {showDropdown && debouncedSearch && suggestions.length === 0 && (
                <div
                  className="absolute z-10 w-full mt-1 rounded-[14px] px-4 py-3 text-sm"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                  }}
                >
                  No projects found
                </div>
              )}
            </div>

            {/* Color picker */}
            <div>
              <label
                className="block font-semibold text-sm mb-3"
                style={{ color: 'var(--text-primary)' }}
              >
                Color
              </label>
              <ColorPicker value={color} onChange={setColor} />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost text-sm font-semibold uppercase tracking-wide"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="btn-primary text-sm font-semibold uppercase tracking-wide"
              >
                {loading ? 'Creating…' : '+ Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
