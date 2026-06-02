'use client'
import { useState } from 'react'
import { AxiosError } from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', name: '', password: '', password2: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const { register } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.password2) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      await register(form.email, form.name, form.password, form.password2)
      router.replace('/dashboard')
    } catch (err) {
      const axiosError = err as AxiosError<{email?: string[], password?: string[]}>
      const data = axiosError.response?.data
      setError(data?.email?.[0] || data?.password?.[0] || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg-base)' }}
    >
      <div
        className="p-8 rounded-[20px] w-full max-w-md"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 25px 50px rgba(0,0,0,.3)',
        }}
      >
        <h1 className="text-2xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          Create account
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          Start managing your tasks
        </p>

        {error && (
          <div
            className="text-sm p-3 rounded-[10px] mb-4"
            style={{ background: 'rgba(248,113,113,.1)', color: '#f87171' }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'Full name',        key: 'name',      type: 'text',     placeholder: 'Alex Smith' },
            { label: 'Email',             key: 'email',     type: 'email',    placeholder: 'you@example.com' },
            { label: 'Password',          key: 'password',  type: 'password', placeholder: 'At least 8 chars' },
            { label: 'Confirm password',  key: 'password2', type: 'password', placeholder: '••••••••' },
          ].map(f => (
            <div key={f.key}>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                {f.label}
              </label>
              <input
                type={f.type}
                required
                value={form[f.key as keyof typeof form]}
                onChange={set(f.key)}
                placeholder={f.placeholder}
                className="input-base"
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-sm text-center mt-4" style={{ color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--accent)' }} className="hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}