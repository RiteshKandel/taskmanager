import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  style?:     React.CSSProperties
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn('rounded-md', className)}
      style={{
        background: 'var(--bg-elevated)',
        backgroundImage: 'linear-gradient(90deg, var(--bg-elevated) 0%, var(--bg-active) 50%, var(--bg-elevated) 100%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.5s infinite',
        ...style,
      }}
    />
  )
}
