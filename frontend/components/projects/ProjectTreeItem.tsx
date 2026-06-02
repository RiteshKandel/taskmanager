'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ProjectTree } from '@/lib/hooks/use-projects'

interface Props {
  project: ProjectTree
  depth?: number
  onNewSubproject: (parentId: number) => void
}

export function ProjectTreeItem({ project, depth = 0, onNewSubproject }: Props) {
  const pathname    = usePathname()
  const isActive    = pathname.includes(`/projects/${project.id}`)
  const hasChildren = project.subprojects?.length > 0

  // Root projects start expanded, subprojects start collapsed.
  const [expanded, setExpanded] = useState(depth === 0)
  const [hovered, setHovered]   = useState(false)

  const indent = depth * 12

  return (
    <div>
      <div
        className="flex items-center gap-1.5 px-2 rounded-[10px] group cursor-pointer select-none transition-all"
        style={{
          paddingLeft: `${8 + indent}px`,
          background: isActive ? 'var(--accent-dim)' : 'transparent',
          color: isActive ? '#a89cf5' : 'var(--text-secondary)',
          minHeight: '32px',
        }}
        onMouseEnter={e => {
          setHovered(true)
          if (!isActive) {
            e.currentTarget.style.background = 'var(--bg-hover)'
            e.currentTarget.style.color = 'var(--text-primary)'
          }
        }}
        onMouseLeave={e => {
          setHovered(false)
          if (!isActive) {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }
        }}
      >
        {/* Expand / collapse chevron */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-4 h-4 flex items-center justify-center flex-shrink-0 transition-colors"
          style={{ color: 'var(--text-muted)' }}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {hasChildren ? (
            <span className={`text-xs transition-transform inline-block ${expanded ? 'rotate-90' : ''}`}>
              ▶
            </span>
          ) : (
            <span
              className="mx-auto"
              style={{
                width: '4px',
                height: '4px',
                borderRadius: '9999px',
                background: 'var(--text-muted)',
                display: 'block',
              }}
            />
          )}
        </button>

        {/* Color dot */}
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: project.color }}
        />

        {/* Project title */}
        <Link
          href={`/dashboard/projects/${project.id}`}
          className="flex-1 text-sm truncate"
          style={{ color: 'inherit', textDecoration: 'none' }}
          onClick={e => e.stopPropagation()}
        >
          {project.title}
        </Link>

        {/* Show action buttons on hover, task count otherwise */}
        {hovered ? (
          <div className="flex items-center gap-0.5 flex-shrink-0 animate-in">
            <button
              onClick={e => { e.stopPropagation(); onNewSubproject(project.id) }}
              className="w-5 h-5 flex items-center justify-center rounded transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
              title="Add subproject"
            >
              +
            </button>
          </div>
        ) : (
          project.task_count > 0 && (
            <span
              className="text-xs font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{
                color: 'var(--text-muted)',
                background: 'var(--bg-elevated)',
                fontSize: '0.6875rem',  /* 11px — decorative badge */
              }}
            >
              {project.task_count}
            </span>
          )
        )}
      </div>

      {/* Recursively render subprojects when expanded */}
      {expanded && hasChildren && (
        <div>
          {project.subprojects.map(sub => (
            <ProjectTreeItem
              key={sub.id}
              project={sub}
              depth={depth + 1}
              onNewSubproject={onNewSubproject}
            />
          ))}
        </div>
      )}
    </div>
  )
}
