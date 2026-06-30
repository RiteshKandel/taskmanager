'use client'
import { useState, useRef, forwardRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/lib/auth-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { notify } from '@/lib/toast'
import { useRouter } from 'next/navigation'

// ── Zod schemas ───────────────────────────────────────────────────────────────
const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
})
const passwordSchema = z.object({
  current_password: z.string().min(1, 'Required'),
  new_password: z
    .string()
    .min(8,  'At least 8 characters')
    .max(128, 'Maximum 128 characters')
    .regex(/[A-Z]/,           'Must contain an uppercase letter')
    .regex(/[a-z]/,           'Must contain a lowercase letter')
    .regex(/[0-9]/,           'Must contain a number')
    .regex(/[^A-Za-z0-9]/,   'Must contain a special character'),
  confirm_password: z.string(),
}).refine(d => d.new_password === d.confirm_password, {
  message: 'Passwords do not match',
  path:    ['confirm_password'],
})

type ProfileForm  = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

// ── Notification labels ───────────────────────────────────────────────────────
const NOTIF_LABELS: Record<string, { label: string; desc: string }> = {
  task_assigned:  { label: 'Task assigned to me',       desc: 'When someone assigns a task to you' },
  task_updated:   { label: 'Task updated or completed', desc: 'When tasks you own are changed' },
  project_invite: { label: 'Added to a project',        desc: 'When you are invited to a project' },
  reminders:      { label: 'Due date reminders',        desc: 'Email reminders before tasks are due' },
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function SettingsPage() {
  const { user }  = useAuth()
  const router    = useRouter()
  const qc        = useQueryClient()
  const fileRef   = useRef<HTMLInputElement>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  // ── Profile form ─────────────────────────────────────────────────────────────
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values:   { name: user?.name || '' },
  })

  const saveProfile = useMutation({
    mutationFn: (data: ProfileForm) =>
      api.patch('/auth/me/', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] })
      notify.profileSaved()
    },
    onError: () => notify.error('Failed to save profile'),
  })

  // ── Avatar upload ─────────────────────────────────────────────────────────────
  const uploadAvatar = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('avatar', file)
      return api.patch('/auth/me/', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] })
      notify.profileSaved()
    },
    onError: () => notify.error('Failed to upload avatar'),
  })

  const removeAvatar = useMutation({
    mutationFn: () => api.patch('/auth/me/', { avatar: null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] })
      notify.profileSaved()
    },
    onError: () => notify.error('Failed to remove avatar'),
  })

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-[600px] mx-auto px-6 py-10">

        {/* ── Page header ── */}
        <div className="mb-8">
          <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Account Settings
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Manage your profile, security, and notification preferences
          </p>
        </div>

        {/* ── Profile card ── */}
        <SettingsCard title="Profile" icon="👤">
          {/* Avatar row */}
          <div className="flex items-center gap-4 mb-6 pb-6"
            style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="relative cursor-pointer group flex-shrink-0"
              onClick={() => fileRef.current?.click()}>
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="avatar"
                  className="w-16 h-16 rounded-2xl object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, var(--accent), #a78bfa)' }}>
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'rgba(0,0,0,.55)', fontSize: '20px' }}>
                📷
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {user?.name}
              </p>
              <p className="text-xs mb-3 truncate" style={{ color: 'var(--text-muted)' }}>
                {user?.email}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadAvatar.isPending}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                  style={{
                    background: 'var(--bg-active)',
                    color:      'var(--text-secondary)',
                    border:     '1px solid var(--border-strong)',
                  }}
                >
                  {uploadAvatar.isPending ? '⟳ Uploading…' : '📷 Change photo'}
                </button>
                {user?.avatar_url && (
                  <button
                    onClick={() => removeAvatar.mutate()}
                    disabled={removeAvatar.isPending}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                    style={{
                      background: 'rgba(248,113,113,.1)',
                      color:      '#f87171',
                      border:     '1px solid rgba(248,113,113,.3)',
                    }}
                  >
                    {removeAvatar.isPending ? '⟳ Removing…' : '🗑 Remove'}
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" className="hidden" accept="image/*"
                onChange={e => e.target.files?.[0] && uploadAvatar.mutate(e.target.files[0])} />
            </div>
          </div>

          {/* Profile form */}
          <form onSubmit={profileForm.handleSubmit(d => saveProfile.mutate(d))} className="space-y-4">
            <SettingsField label="Full name" error={profileForm.formState.errors.name?.message}>
              <SettingsInput
                {...profileForm.register('name')}
                placeholder="Your name"
                hasError={!!profileForm.formState.errors.name}
              />
            </SettingsField>
            <SettingsField label="Email address">
              <SettingsInput
                value={user?.email || ''}
                readOnly
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
              />
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                Email cannot be changed
              </p>
            </SettingsField>
            <div className="pt-1">
              <SettingsButton loading={saveProfile.isPending}>Save changes</SettingsButton>
            </div>
          </form>
        </SettingsCard>

        {/* ── Change password card ── */}
        <SettingsCard title="Change Password" icon="🔒">
          <PasswordSection />
        </SettingsCard>

        {/* ── Notification preferences card ── */}
        <SettingsCard title="Email Notifications" icon="🔔">
          <NotificationPrefs />
        </SettingsCard>

        {/* ── Danger zone ── */}
        <div className="rounded-2xl p-5"
          style={{
            background: 'rgba(248,113,113,.05)',
            border:     '1px solid rgba(248,113,113,.18)',
          }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">⚠️</span>
            <h3 className="text-sm font-bold" style={{ color: '#f87171' }}>Danger Zone</h3>
          </div>
          <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
            Permanently delete your account, all projects you own, and all your tasks.
            This action <strong style={{ color: 'var(--text-secondary)' }}>cannot be undone</strong>.
          </p>

          {deleteConfirm ? (
            <DeleteConfirmDialog onCancel={() => setDeleteConfirm(false)} />
          ) : (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="text-xs font-semibold px-4 py-2 rounded-lg transition-all"
              style={{
                background: 'rgba(248,113,113,.1)',
                color:      '#f87171',
                border:     '1px solid rgba(248,113,113,.3)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,.18)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,.1)' }}
            >
              🗑 Delete my account
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

// ── Password strength helpers ─────────────────────────────────────────────────
const PW_REQUIREMENTS = [
  { id: 'len',     label: 'At least 8 characters',      test: (v: string) => v.length >= 8 },
  { id: 'upper',   label: 'One uppercase letter (A–Z)',  test: (v: string) => /[A-Z]/.test(v) },
  { id: 'lower',   label: 'One lowercase letter (a–z)',  test: (v: string) => /[a-z]/.test(v) },
  { id: 'number',  label: 'One number (0–9)',            test: (v: string) => /[0-9]/.test(v) },
  { id: 'special', label: 'One special character (!@#…)',test: (v: string) => /[^A-Za-z0-9]/.test(v) },
]

function getStrength(pw: string) {
  const passed = PW_REQUIREMENTS.filter(r => r.test(pw)).length
  if (!pw) return 0
  return passed   // 1-5
}

const STRENGTH_LABELS = ['', 'Very weak', 'Weak', 'Fair', 'Strong', 'Very strong']
const STRENGTH_COLORS = ['', '#f87171', '#fb923c', '#facc15', '#4ade80', '#22c55e']

// ── Password section ──────────────────────────────────────────────────────────
function PasswordSection() {
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew,     setShowNew]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })

  const newPw = useWatch({ control, name: 'new_password', defaultValue: '' })
  const strength = getStrength(newPw || '')

  const changePassword = useMutation({
    mutationFn: (data: PasswordForm) =>
      api.post('/auth/change-password/', {
        current_password: data.current_password,
        new_password:     data.new_password,
      }),
    onSuccess: () => { notify.profileSaved(); reset() },
    onError: (e: any) => {
      const msg =
        e.response?.data?.current_password?.[0] ||
        e.response?.data?.new_password?.[0] ||
        e.response?.data?.error ||
        'Failed to change password'
      notify.error(msg)
    },
  })

  return (
    <form onSubmit={handleSubmit(d => changePassword.mutate(d))} className="space-y-4">

      {/* Current password */}
      <SettingsField label="Current password" error={errors.current_password?.message}>
        <div className="relative">
          <SettingsInput
            type={showCurrent ? 'text' : 'password'}
            {...register('current_password')}
            placeholder="Your current password"
            hasError={!!errors.current_password}
            style={{ paddingRight: '2.5rem' }}
          />
          <EyeToggle show={showCurrent} onToggle={() => setShowCurrent(s => !s)} />
        </div>
      </SettingsField>

      {/* New password */}
      <SettingsField label="New password" error={errors.new_password?.message}>
        <div className="relative">
          <SettingsInput
            type={showNew ? 'text' : 'password'}
            {...register('new_password')}
            placeholder="Min 8 chars, mixed case, number & symbol"
            hasError={!!errors.new_password}
            style={{ paddingRight: '2.5rem' }}
          />
          <EyeToggle show={showNew} onToggle={() => setShowNew(s => !s)} />
        </div>

        {/* Strength bar */}
        {newPw && (
          <div className="mt-2 space-y-1.5">
            <div className="flex gap-1">
              {[1,2,3,4,5].map(i => (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full transition-all duration-300"
                  style={{
                    background: i <= strength ? STRENGTH_COLORS[strength] : 'var(--border)',
                  }}
                />
              ))}
            </div>
            <p className="text-[10px] font-semibold" style={{ color: STRENGTH_COLORS[strength] }}>
              {STRENGTH_LABELS[strength]}
            </p>

            {/* Per-requirement checklist */}
            <div className="grid grid-cols-1 gap-0.5 pt-0.5">
              {PW_REQUIREMENTS.map(req => {
                const ok = req.test(newPw)
                return (
                  <div key={req.id} className="flex items-center gap-1.5">
                    <span style={{ color: ok ? '#4ade80' : 'var(--text-muted)', fontSize: '11px' }}>
                      {ok ? '✓' : '○'}
                    </span>
                    <span
                      className="text-[11px] transition-colors"
                      style={{ color: ok ? '#4ade80' : 'var(--text-muted)' }}
                    >
                      {req.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </SettingsField>

      {/* Confirm password */}
      <SettingsField label="Confirm new password" error={errors.confirm_password?.message}>
        <div className="relative">
          <SettingsInput
            type={showConfirm ? 'text' : 'password'}
            {...register('confirm_password')}
            placeholder="Repeat new password"
            hasError={!!errors.confirm_password}
            style={{ paddingRight: '2.5rem' }}
          />
          <EyeToggle show={showConfirm} onToggle={() => setShowConfirm(s => !s)} />
        </div>
      </SettingsField>

      <div className="pt-1">
        <SettingsButton loading={isSubmitting || changePassword.isPending}>
          Update password
        </SettingsButton>
      </div>
    </form>
  )
}

// ── Eye toggle button ─────────────────────────────────────────────────────────
function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm transition-opacity"
      style={{ color: 'var(--text-muted)', lineHeight: 1 }}
      tabIndex={-1}
      aria-label={show ? 'Hide password' : 'Show password'}
    >
      {show ? '🙈' : '👁'}
    </button>
  )
}

// ── Notification preferences ──────────────────────────────────────────────────
function NotificationPrefs() {
  const qc = useQueryClient()

  const { data: prefs = {} as Record<string, boolean>, isLoading } = useQuery({
    queryKey: ['notif-prefs'],
    queryFn:  () => api.get('/auth/notification-prefs/').then(r => r.data),
  })

  const toggle = useMutation({
    mutationFn: (field: string) =>
      api.patch('/auth/notification-prefs/', { [field]: !prefs[field] }),
    onMutate: async (field: string) => {
      // Optimistic update
      await qc.cancelQueries({ queryKey: ['notif-prefs'] })
      const prev = qc.getQueryData(['notif-prefs'])
      qc.setQueryData(['notif-prefs'], (old: any) => ({ ...old, [field]: !old[field] }))
      return { prev }
    },
    onError: (_err, _field, ctx: any) => {
      qc.setQueryData(['notif-prefs'], ctx.prev)
      notify.error('Failed to update preference')
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['notif-prefs'] }),
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: 'var(--bg-active)' }} />
        ))}
      </div>
    )
  }

  return (
    <div>
      {Object.entries(NOTIF_LABELS).map(([key, { label, desc }], i, arr) => {
        const isOn = !!prefs[key]
        return (
          <div
            key={key}
            className="flex items-center justify-between py-3.5"
            style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none' }}
          >
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</p>
            </div>

            {/* Toggle switch */}
            <button
              onClick={() => toggle.mutate(key)}
              className="relative w-10 h-[22px] rounded-full transition-colors flex-shrink-0 focus:outline-none"
              style={{
                background:  isOn ? 'var(--accent)' : 'var(--bg-active)',
                border:      isOn ? '1px solid rgba(124,106,240,.4)' : '1px solid var(--border-strong)',
                transition:  'background .2s, border-color .2s',
              }}
              aria-checked={isOn}
              role="switch"
            >
              <span
                className="absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow transition-all duration-200"
                style={{ left: isOn ? 'calc(100% - 20px)' : '2px' }}
              />
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ── Delete confirm dialog ─────────────────────────────────────────────────────
function DeleteConfirmDialog({ onCancel }: { onCancel: () => void }) {
  const router              = useRouter()
  const [password, setPass] = useState('')
  const [loading, setLoad]  = useState(false)
  const [error, setError]   = useState('')

  const handleDelete = async () => {
    if (!password) { setError('Enter your password to confirm'); return }
    setLoad(true)
    try {
      await api.delete('/auth/delete-account/', { data: { password } })
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      router.push('/login')
    } catch (e: any) {
      setError(e.response?.data?.error || 'Incorrect password')
      setLoad(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
        Type your password to confirm:
      </p>
      <input
        type="password"
        value={password}
        onChange={e => { setPass(e.target.value); setError('') }}
        placeholder="Your password"
        className="w-full text-sm rounded-lg px-3 py-2 outline-none"
        style={{
          background: 'var(--bg-active)',
          border:     `1px solid ${error ? 'rgba(248,113,113,.5)' : 'rgba(248,113,113,.3)'}`,
          color:      'var(--text-primary)',
        }}
      />
      {error && <p className="text-xs" style={{ color: '#f87171' }}>⚠ {error}</p>}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 text-sm py-2 rounded-lg transition-colors"
          style={{ background: 'var(--bg-active)', color: 'var(--text-secondary)' }}
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="flex-1 text-sm py-2 rounded-lg font-semibold transition-all disabled:opacity-50"
          style={{ background: '#f87171', color: 'white' }}
        >
          {loading ? 'Deleting…' : 'Permanently delete'}
        </button>
      </div>
    </div>
  )
}

// ── Shared UI primitives ──────────────────────────────────────────────────────
function SettingsCard({
  title, icon, children,
}: {
  title: string
  icon?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl overflow-hidden mb-4"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2 px-5 py-3.5"
        style={{ borderBottom: '1px solid var(--border)' }}>
        {icon && <span className="text-sm">{icon}</span>}
        <span className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-secondary)' }}>
          {title}
        </span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function SettingsField({
  label, error, children,
}: {
  label: string; error?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5"
        style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: '#f87171' }}>
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  )
}

const SettingsInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }>(
  ({ hasError, style, ...props }, ref) => (
    <input
      ref={ref}
      className="w-full text-sm rounded-xl px-3 py-2.5 outline-none transition-all"
      style={{
        background:  'var(--bg-active)',
        color:       'var(--text-primary)',
        border:      `1px solid ${hasError ? 'rgba(248,113,113,.5)' : 'var(--border)'}`,
        ...style,
      }}
      onFocus={e => { if (!hasError) e.currentTarget.style.borderColor = 'var(--accent)' }}
      onBlur={e  => { e.currentTarget.style.borderColor = hasError ? 'rgba(248,113,113,.5)' : 'var(--border)' }}
      {...props}
    />
  )
)
SettingsInput.displayName = 'SettingsInput'

function SettingsButton({
  loading, children,
}: {
  loading?: boolean; children: React.ReactNode
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-50"
      style={{ background: 'var(--accent)', color: 'white' }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--accent-hover)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)' }}
    >
      {loading ? '⟳ Saving…' : children}
    </button>
  )
}
