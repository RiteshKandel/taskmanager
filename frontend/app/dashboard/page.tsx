'use client'
import { useAuth } from '@/lib/auth-context'

export default function Dashboard() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="p-8" style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
        Loading dashboard...
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl">
      {/* Welcome heading — h1 inherits 20px from global styles */}
      <h1 className="mb-1" style={{ color: 'var(--text-primary)' }}>
        Welcome, {user?.name}!
      </h1>
      <p
        className="mb-8"
        style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}
      >
        {user?.email}
      </p>

      {/* Hint card */}
      <div
        className="rounded-[14px] px-5 py-4"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
        }}
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
          Select a project from the sidebar to start managing tasks, or create a new project with the <strong style={{ color: 'var(--text-primary)' }}>+</strong> button above the project list.
        </p>
      </div>
    </div>
  )
}