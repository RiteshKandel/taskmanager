'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
})

export default function Home() {
  const [status, setStatus] = useState('Checking...')

  useEffect(() => {
    api.get('/health/')
      .then(res => setStatus(res.data.message))
      .catch(() => setStatus('Could not reach Django!'))
  }, [])

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
        Task Manager
      </h1>
      <p style={{ color: 'var(--text-secondary)' }}>
        Backend status: <strong>{status}</strong>
      </p>
    </main>
  )
}