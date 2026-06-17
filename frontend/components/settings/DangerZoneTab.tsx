'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUpdateProject, useDeleteProject } from '@/lib/hooks/use-projects'
import { useTransferOwnership } from '@/lib/hooks/use-project-settings'
import { useMembers } from '@/lib/hooks/use-members'
import { notify } from '@/lib/toast'

interface Props {
  project: any
  isOwner: boolean
  onClose: () => void
}

export function DangerZoneTab({ project, isOwner, onClose }: Props) {
  const router = useRouter()
  const updateProject    = useUpdateProject()
  const deleteProject    = useDeleteProject()
  const transferOwnership = useTransferOwnership(project.id)
  const { data: members = [] } = useMembers(project.id)

  const [transferTo, setTransferTo]         = useState<number | ''>('')
  const [confirmText, setConfirmText]       = useState('')
  const [showDeleteConfirm, setShowDelete]  = useState(false)

  // Members who can receive ownership (exclude current owner)
  const otherMembers = (members as Array<{ id: number; user: { id: number; name: string }; role: string }>)
    .filter(m => m.role !== 'owner')

  const handleArchiveToggle = () => {
    updateProject.mutate(
      { id: project.id, is_archived: !project.is_archived },
      {
        onSuccess: () => notify.success(
          project.is_archived ? 'Project unarchived' : 'Project archived'
        ),
      }
    )
  }

  const handleTransfer = () => {
    if (!transferTo) return
    if (!window.confirm('Transfer ownership? You will be demoted to admin.')) return
    transferOwnership.mutate(Number(transferTo))
  }

  const handleDelete = () => {
    if (confirmText !== project.title) return
    deleteProject.mutate(project.id, {
      onSuccess: () => { onClose(); router.push('/dashboard') },
    })
  }

  const dangerCard = {
    background: 'rgba(248,113,113,.06)',
    border: '1px solid rgba(248,113,113,.2)',
  }
  const dangerBtn = {
    background: 'rgba(248,113,113,.12)',
    color: '#f87171',
    border: '1px solid rgba(248,113,113,.3)',
  }

  return (
    <div className="space-y-4">

      {/* Archive */}
      <div className="rounded-xl p-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
        <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          {project.is_archived ? 'Unarchive project' : 'Archive project'}
        </h4>
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          Hides it from the sidebar without deleting anything. Reversible anytime.
        </p>
        <button
          onClick={handleArchiveToggle}
          disabled={updateProject.isPending}
          className="text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-40"
          style={{ background: 'var(--bg-active)', color: 'var(--text-secondary)', border: '1px solid var(--border-strong)' }}
        >
          {project.is_archived ? '📤 Unarchive' : '📦 Archive project'}
        </button>
      </div>

      {/* Owner-only section */}
      {isOwner && (
        <>
          {/* Transfer ownership */}
          <div className="rounded-xl p-4" style={dangerCard}>
            <h4 className="text-sm font-semibold mb-1" style={{ color: '#f87171' }}>
              Transfer ownership
            </h4>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
              Make another member the new owner. You&apos;ll be demoted to admin.
            </p>
            {otherMembers.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Add at least one other member first.
              </p>
            ) : (
              <div className="flex gap-2">
                <select
                  value={transferTo}
                  onChange={e => setTransferTo(e.target.value ? Number(e.target.value) : '')}
                  className="flex-1 text-xs rounded-lg px-2.5 py-2 outline-none"
                  style={{ background: 'var(--bg-active)', border: '1px solid var(--border-strong)', color: 'var(--text-secondary)' }}
                >
                  <option value="">Select a member…</option>
                  {otherMembers.map(m => (
                    <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleTransfer}
                  disabled={!transferTo || transferOwnership.isPending}
                  className="text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-40"
                  style={dangerBtn}
                >
                  Transfer
                </button>
              </div>
            )}
          </div>

          {/* Delete project */}
          <div className="rounded-xl p-4" style={dangerCard}>
            <h4 className="text-sm font-semibold mb-1" style={{ color: '#f87171' }}>
              Delete project
            </h4>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
              Permanently deletes this project and every task inside it. Cannot be undone.
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDelete(true)}
                className="text-xs font-semibold px-3 py-2 rounded-lg"
                style={dangerBtn}
              >
                Delete project
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs" style={{ color: '#f87171' }}>
                  Type <strong>{project.title}</strong> to confirm:
                </p>
                <input
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value)}
                  placeholder={project.title}
                  className="w-full text-xs rounded-lg px-3 py-2 outline-none"
                  style={{ background: 'var(--bg-active)', border: '1px solid rgba(248,113,113,.4)', color: 'var(--text-primary)' }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowDelete(false); setConfirmText('') }}
                    className="flex-1 text-xs py-2 rounded-lg"
                    style={{ background: 'var(--bg-active)', color: 'var(--text-secondary)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={confirmText !== project.title || deleteProject.isPending}
                    className="flex-1 text-xs font-semibold py-2 rounded-lg disabled:opacity-40"
                    style={{ background: '#f87171', color: 'white' }}
                  >
                    Permanently delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
