'use client'
import { ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'ghost' | 'danger' | 'outline'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: { background: 'var(--accent)', color: 'white' },
  ghost:   { background: 'transparent', color: 'var(--text-secondary)' },
  outline: { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-strong)' },
  danger:  { background: 'rgba(248,113,113,.12)', color: '#f87171' },
}

const variantHoverStyles: Record<Variant, React.CSSProperties> = {
  primary: { background: 'var(--accent-hover)' },
  ghost:   { background: 'var(--bg-hover)', color: 'var(--text-primary)' },
  outline: { borderColor: 'var(--border-focus)', color: 'var(--text-primary)' },
  danger:  { background: 'rgba(248,113,113,.2)' },
}

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: '12px', borderRadius: '10px' },
  md: { padding: '8px 16px', fontSize: '13px', borderRadius: '10px' },
  lg: { padding: '10px 20px', fontSize: '13px', borderRadius: '14px' },
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'ghost', size = 'md', className = '', style, children, disabled, onMouseEnter, onMouseLeave, ...props }, ref) => {
    const baseStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      fontWeight: 500,
      transition: 'all 150ms',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1,
      border: 'none',
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...style,
    }

    return (
      <button
        ref={ref}
        disabled={disabled}
        style={baseStyle}
        className={className}
        onMouseEnter={e => {
          if (!disabled) {
            Object.assign(e.currentTarget.style, variantHoverStyles[variant])
          }
          onMouseEnter?.(e)
        }}
        onMouseLeave={e => {
          Object.assign(e.currentTarget.style, variantStyles[variant])
          onMouseLeave?.(e)
        }}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
