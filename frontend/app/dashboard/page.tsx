'use client'

import { useAuth } from '@/lib/auth-context'
import { useProjects } from '@/lib/hooks/use-projects'
import { useAllTasks } from '@/lib/hooks/use-tasks'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'

export default function Dashboard() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { data: projects = [], isLoading: projectsLoading } = useProjects()
  const { data: tasks = [], isLoading: tasksLoading } = useAllTasks()

  const loading = authLoading || projectsLoading || tasksLoading

  const stats = useMemo(() => {
    const totalProjects = projects.length
    const activeTasks = tasks.filter((t: any) => !t.is_done).length
    const highPriority = tasks.filter((t: any) => !t.is_done && (t.priority === 3 || t.priority === 4)).length
    return { totalProjects, activeTasks, highPriority }
  }, [projects, tasks])

  const recentProjects = projects.slice(0, 4) // Just take first 4 for now
  const urgentTasks = tasks
    .filter((t: any) => !t.is_done)
    .sort((a: any, b: any) => b.priority - a.priority)
    .slice(0, 6)

  if (loading) {
    return (
      <div className="p-8 h-full flex flex-col gap-6 animate-pulse">
        <div className="h-20 w-1/3 rounded-2xl" style={{ background: 'var(--bg-elevated)' }}></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 rounded-[24px]" style={{ background: 'var(--bg-elevated)' }}></div>
          <div className="h-32 rounded-[24px]" style={{ background: 'var(--bg-elevated)' }}></div>
          <div className="h-32 rounded-[24px]" style={{ background: 'var(--bg-elevated)' }}></div>
        </div>
      </div>
    )
  }

  const getPriorityColor = (p: number) => {
    switch(p) {
      case 4: return '#f87171' // Urgent
      case 3: return '#fbbf24' // High
      case 2: return '#60a5fa' // Medium
      default: return '#9ca3af' // Low
    }
  }

  return (
    <div 
      className="p-4 md:p-8 h-full overflow-y-auto relative"
      style={{
        background: 'radial-gradient(circle at top right, rgba(124, 106, 240, 0.05), transparent 40%)'
      }}
    >
      {/* Welcome Section */}
      <div className="mb-6 md:mb-10 relative z-10">
        <h1 
          className="text-2xl md:text-4xl font-extrabold mb-2 tracking-tight"
          style={{ 
            background: 'linear-gradient(135deg, var(--text-primary) 30%, var(--accent))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]}!
        </h1>
        <p style={{ color: 'var(--text-secondary)' }} className="text-xs md:text-sm">
          Here's an overview of what's happening across your projects today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 md:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-10 relative z-10">
        <StatCard title="Projects" value={stats.totalProjects} icon="📁" />
        <StatCard title="To Do" value={stats.activeTasks} icon="✓" />
        <StatCard title="🔥 High" value={stats.highPriority} icon="" color="#f87171" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 relative z-10">
        {/* Urgent Tasks */}
        <div 
          className="rounded-[24px] p-6 shadow-sm border"
          style={{
            background: 'var(--bg-surface)',
            backdropFilter: 'blur(10px)',
            borderColor: 'var(--border)'
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Priority Tasks</h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(248, 113, 113, 0.1)', color: '#f87171' }}>
              Action Needed
            </span>
          </div>

          <div className="space-y-3">
            {urgentTasks.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No pending tasks! You're all caught up.</p>
            ) : (
              urgentTasks.map((task: any) => (
                <div 
                  key={task.id} 
                  className="group flex items-center justify-between p-3.5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer border"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                  onClick={() => router.push(`/dashboard/projects/${task.project}?view=list&task=${task.id}`)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: getPriorityColor(task.priority) }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{task.title}</p>
                      <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {task.due_date ? `Due ${new Date(task.due_date).toLocaleDateString()}` : 'No due date'}
                      </p>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity pl-4">
                    <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>View &rarr;</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Projects */}
        <div 
          className="rounded-[24px] p-6 shadow-sm border flex flex-col"
          style={{
            background: 'var(--bg-surface)',
            backdropFilter: 'blur(10px)',
            borderColor: 'var(--border)'
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Your Projects</h2>
            <Link href="/dashboard/hub" className="text-xs font-medium" style={{ color: 'var(--accent)' }}>View all</Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 content-start">
            {recentProjects.length === 0 ? (
              <p className="text-sm col-span-2" style={{ color: 'var(--text-muted)' }}>No projects found. Create one to get started!</p>
            ) : (
              recentProjects.map((project: any) => (
                <Link 
                  href={`/dashboard/projects/${project.id}`} 
                  key={project.id}
                  className="block p-4 rounded-2xl border transition-all hover:scale-[1.02] hover:shadow-md group"
                  style={{ 
                    background: 'var(--bg-elevated)',
                    borderColor: 'var(--border)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = project.color
                    e.currentTarget.style.background = `linear-gradient(145deg, var(--bg-surface), ${project.color}10)`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.background = 'var(--bg-elevated)'
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-sm transition-transform group-hover:scale-110"
                      style={{ background: project.color, color: '#fff' }}
                    >
                      {project.icon || project.title.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    {project.title}
                  </h3>
                  <p className="text-xs mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>
                    {project.task_count} task{project.task_count !== 1 ? 's' : ''}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color = 'var(--accent)' }: { title: string, value: number, icon: string, color?: string }) {
  return (
    <div 
      className="rounded-2xl md:rounded-[24px] p-4 md:p-6 border transition-all hover:-translate-y-1 hover:shadow-lg"
      style={{
        background: 'var(--bg-surface)',
        backdropFilter: 'blur(12px)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] md:text-sm font-medium mb-1 md:mb-2" style={{ color: 'var(--text-secondary)' }}>{title}</p>
          <p className="text-2xl md:text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>{value}</p>
        </div>
        {icon && (
          <div 
            className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-[16px] flex items-center justify-center text-base md:text-xl shadow-inner flex-shrink-0"
            style={{ 
              background: `color-mix(in srgb, ${color} 15%, transparent)`,
              color: color,
              border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}