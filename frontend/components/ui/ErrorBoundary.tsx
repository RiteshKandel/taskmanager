'use client'
import { Component, ReactNode } from 'react'

interface Props {
  children:  ReactNode
  fallback?: ReactNode
  onReset?:  () => void
}
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: unknown) {
    // Log to console (replace with Sentry later)
    console.error('ErrorBoundary caught:', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="text-4xl mb-4">💥</div>
          <h3
            className="text-sm font-semibold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Something went wrong
          </h3>
          <p
            className="text-xs mb-5 max-w-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={this.handleReset}
            className="text-xs font-medium px-4 py-2 rounded-lg transition-colors"
            style={{
              background: 'rgba(248,113,113,.12)',
              color: '#f87171',
              border: '1px solid rgba(248,113,113,.3)',
            }}
          >
            ↺ Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
