'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { notify } from '@/lib/toast'

// ── Validation schema ──
const loginSchema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})
type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { login } = useAuth()
  const router    = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password)
      router.replace('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      if (msg?.toLowerCase().includes('credential') || msg?.toLowerCase().includes('password')) {
        setError('password', { message: 'Incorrect email or password' })
      } else {
        notify.error(msg || 'Login failed')
      }
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg-base)' }}
    >
      <div
        className="w-full max-w-md rounded-[20px] p-8"
        style={{
          background:  'var(--bg-surface)',
          border:      '1px solid var(--border)',
          boxShadow:   '0 25px 50px rgba(0,0,0,.3)',
        }}
      >
        <h1 className="text-2xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          Sign in
        </h1>
        <p className="text-sm mb-7" style={{ color: 'var(--text-secondary)' }}>
          Welcome back to Task Manager
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Email field */}
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder="you@example.com"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
              style={{
                background: 'var(--bg-active)',
                border:     `1px solid ${errors.email ? 'rgba(248,113,113,.5)' : 'var(--border)'}`,
                color:      'var(--text-primary)',
              }}
            />
            {errors.email && (
              <p className="text-xs mt-1.5" style={{ color: '#f87171' }}>
                ⚠ {errors.email.message}
              </p>
            )}
          </div>

          {/* Password field */}
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Password
            </label>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
              style={{
                background: 'var(--bg-active)',
                border:     `1px solid ${errors.password ? 'rgba(248,113,113,.5)' : 'var(--border)'}`,
                color:      'var(--text-primary)',
              }}
            />
            {errors.password && (
              <p className="text-xs mt-1.5" style={{ color: '#f87171' }}>
                ⚠ {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full justify-center mt-2"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-sm text-center mt-4" style={{ color: 'var(--text-muted)' }}>
          No account?{' '}
          <Link href="/register" style={{ color: 'var(--accent)' }} className="hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}