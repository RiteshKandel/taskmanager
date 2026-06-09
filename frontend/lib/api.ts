import axios, { InternalAxiosRequestConfig, AxiosError } from 'axios'
import { notify } from '@/lib/toast'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window === 'undefined') return config
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error: AxiosError) => Promise.reject(error))

api.interceptors.response.use(
  res => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Skip token refresh for auth endpoints to avoid infinite loops.
    const url = original?.url || ''
    const isAuthEndpoint = url.includes('/auth/login/') || url.includes('/auth/register/')
      || url.includes('/auth/refresh/') || url.includes('/auth/logout/') || url.includes('/auth/me/')
    if (isAuthEndpoint) return Promise.reject(error)

    const status = error.response?.status

    // Show targeted toasts for specific HTTP errors
    if (status === 403) {
      notify.permError()
    } else if (status === 500) {
      notify.error('Server error — try again in a moment')
    } else if (!error.response) {
      notify.networkError()
    }

    if (status === 401 && !original._retry) {
      original._retry = true
      try {
        if (typeof window !== 'undefined') {
          const refresh = localStorage.getItem('refresh_token')
          const res = await api.post('/auth/refresh/', { refresh })
          const newToken = res.data.access
          localStorage.setItem('access_token', newToken)
          document.cookie = `access_token=${newToken}; path=/; max-age=86400; SameSite=Lax`
          original.headers.Authorization = `Bearer ${newToken}`
          return api(original)
        }
      } catch {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
