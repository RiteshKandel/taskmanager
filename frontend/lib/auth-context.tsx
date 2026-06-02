'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '@/lib/api'
import { AxiosResponse } from 'axios'

type User = {
  id: number
  email: string
  name: string
  avatar: string | null
}

type AuthContextType = {
  user:     User | null
  loading:  boolean
  login:    (email: string, password: string) => Promise<AxiosResponse>
  register: (email: string, name: string, password: string, password2: string) => Promise<AxiosResponse>
  logout:   () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const syncUser = async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      const res = await api.get('/auth/me/')
      setUser(res.data)
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    syncUser()

    const onAuthChanged = () => {
      setLoading(true)
      syncUser()
    }

    window.addEventListener('auth:changed', onAuthChanged)
    window.addEventListener('storage', onAuthChanged)

    return () => {
      window.removeEventListener('auth:changed', onAuthChanged)
      window.removeEventListener('storage', onAuthChanged)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login/', { email, password })
    localStorage.setItem('access_token',  res.data.access)
    localStorage.setItem('refresh_token', res.data.refresh)
    document.cookie = `access_token=${res.data.access}; path=/; max-age=86400; SameSite=Lax`
    setUser(res.data.user)
    return res
  }

  const register = async (email: string, name: string, password: string, password2: string) => {
    const res = await api.post('/auth/register/', { email, name, password, password2 })
    localStorage.setItem('access_token',  res.data.access)
    localStorage.setItem('refresh_token', res.data.refresh)
    document.cookie = `access_token=${res.data.access}; path=/; max-age=86400; SameSite=Lax`
    setUser(res.data.user)
    return res
  }

  const logout = async () => {
    const refresh = localStorage.getItem('refresh_token')
    await api.post('/auth/logout/', { refresh }).catch(() => {})
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    setUser(null)
    window.dispatchEvent(new Event('auth:changed'))
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}