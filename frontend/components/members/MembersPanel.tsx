'use client'
import { useState } from 'react'
import {
  useMembers, useAddMember, useUpdateMemberRole,
  useRemoveMember, usePermissions,
} from '@/lib/hooks/use-members'
import { useIsMobile } from '@/lib/hooks/use-media-query'
import type { Member, Role } from '@/lib/hooks/use-members'

const ROLES: Role[] = ['admin', 'editor', 'viewer']

interface Props { projectId: number; onClose: () => void }

export function MembersPanel({ projectId, onClose }: Props) {
  const { data: membersRaw = [], isLoading } = useMembers(projectId)
  const members = Array.isArray(membersRaw) ? membersRaw : []
  const { canManage }   = usePermissions(projectId)
  const isMobile        = useIsMobile()
  const addMember       = useAddMember(projectId)
  const updateRole      = useUpdateMemberRole(projectId)
  const removeMember    = useRemoveMember(projectId)

  const [email, setEmail]       = useState('')
  const [role, setRole]         = useState<Role>('viewer')
  const [addError, setAddError] = useState('')
  const [adding, setAdding]     = useState(false)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError('')
    setAdding(true)
    try {
      await addMember.mutateAsync({ email, role })
      setEmail('')
      setRole('viewer')
    } catch (err: any) {
      const data = err.response?.data
      setAddError(
        data?.email?.[0] || data?.non_field_errors?.[0] || 'Could not add member.'
      )
    } finally { setAdding(false) }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,.45)' }}
        onClick={onClose}
      />
      <div
        className="fixed z-50 flex flex-col"
        style={isMobile ? {
          inset: 0,
          background: 'var(--bg-surface)',
          animation: 'slideUpFull .25s ease',
        } : {
          right: 0, top: 0, height: '100%', width: '100%', maxWidth: '380px',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border)',
          animation: 'slideInRight .25s ease',
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div>
            {/* h2 inherits 18px from heading styles */}
            <h2 style={{ color: 'var(--text-primary)' }}>
              Project members
            </h2>
            <p
              className="mt-0.5"
              style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}   /* 13px */
            >
              {members.length} member{members.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-[8px] flex items-center justify-center transition-colors"
            style={{ background: 'var(--bg-active)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}
            aria-label="Close members panel"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {/* Add member form */}
          {canManage && (
            <div
              className="rounded-[14px] p-4"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              {/* 15px heading for form section */}
              <p
                className="font-medium mb-3"
                style={{ fontSize: '0.9375rem', color: 'var(--text-primary)' }}
              >
                Add member
              </p>
              {addError && (
                <div
                  className="text-sm p-3 rounded-[10px] mb-3"   /* text-sm = 14px */
                  style={{
                    background: 'rgba(248,113,113,.1)',
                    color: '#f87171',
                    lineHeight: 1.5,
                  }}
                >
                  {addError}
                </div>
              )}
              <form onSubmit={handleAdd} className="space-y-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="member@example.com"
                  className="input-base"
                />
                <div className="flex gap-2">
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as Role)}
                    className="flex-1 rounded-[10px] px-3 py-2.5 outline-none"
                    style={{
                      fontSize: '0.875rem',   /* 14px */
                      background: 'var(--bg-active)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      fontFamily: 'inherit',
                    }}
                  >
                    {ROLES.map(r => (
                      <option key={r} value={r}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={adding}
                    className="btn-primary"
                  >
                    {adding ? 'Adding…' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Member list */}
          <div>
            <p className="section-label mb-3">
              Members
            </p>
            {isLoading ? (
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)' }}>Loading…</p>
            ) : (
              <div className="space-y-1">
                {members.map(m => (
                  <MemberRow
                    key={m.id}
                    member={m}
                    canManage={canManage && m.role !== 'owner'}
                    onRoleChange={(role) => updateRole.mutate({ memberId: m.id, role })}
                    onRemove={() => {
                      if (confirm(`Remove ${m.user.name} from this project?`))
                        removeMember.mutate(m.id)
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ── Single member row ──────────────────────────────────────────
function MemberRow({ member, canManage, onRoleChange, onRemove }: {
  member: Member
  canManage: boolean
  onRoleChange: (role: Role) => void
  onRemove: () => void
}) {
  const initials = member.user.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  return (
    <div
      className="flex items-center gap-3 rounded-[10px] px-2 py-2.5 transition-colors"
      style={{ minHeight: '52px' }}
    >
      {/* Avatar — 32px, initials at 11px */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
        style={{
          fontSize: '0.6875rem',   /* 11px — decorative */
          background: 'linear-gradient(135deg, var(--accent), #a78bfa)',
        }}
      >
        {member.user.avatar
          ? <img src={member.user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
          : initials}
      </div>

      {/* Name + email */}
      <div className="flex-1 min-w-0">
        <p
          className="truncate font-medium"
          style={{ fontSize: '0.9375rem', color: 'var(--text-primary)' }}   /* 15px */
        >
          {member.user.name}
        </p>
        <p
          className="truncate"
          style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '1px' }}   /* 12px */
        >
          {member.user.email}
        </p>
      </div>

      {/* Role badge or selector — 13px */}
      {canManage ? (
        <select
          value={member.role}
          onChange={e => onRoleChange(e.target.value as Role)}
          className="rounded-[10px] px-2 py-1.5 outline-none"
          style={{
            fontSize: '0.8125rem',   /* 13px */
            background: 'var(--bg-active)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            fontFamily: 'inherit',
          }}
        >
          {ROLES.map(r => (
            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
          ))}
        </select>
      ) : (
        <span
          className="tag capitalize"
          style={{ background: 'var(--bg-active)', color: 'var(--text-secondary)' }}
        >
          {member.role}
        </span>
      )}

      {/* Remove button */}
      {canManage && (
        <button
          onClick={onRemove}
          className="transition-colors"
          style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1, padding: '4px' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          title="Remove member"
          aria-label={`Remove ${member.user.name}`}
        >
          ✕
        </button>
      )}
    </div>
  )
}
