'use client'
import { useState } from 'react'

const SWATCHES = [
  '#7c6af0', '#a78bfa', '#DB2777', '#f87171',
  '#fbbf24', '#34d399', '#059669', '#0891B2',
  '#60a5fa', '#64748B', '#7F1D1D', '#1E3A5F',
]

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [custom, setCustom] = useState('')

  return (
    <div>
      <div className="flex flex-wrap gap-2.5 mb-3">
        {SWATCHES.map(color => (
          <button
            key={color}
            type="button"
            onClick={() => { onChange(color); setCustom('') }}
            className="w-7 h-7 rounded-full transition-transform hover:scale-110 focus:outline-none"
            style={{
              backgroundColor: color,
              outline: value === color ? `2px solid ${color}` : 'none',
              outlineOffset: '3px',
            }}
            aria-label={color}
            aria-pressed={value === color}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-full flex-shrink-0 transition-colors"
          style={{ backgroundColor: value, border: '1px solid var(--border)' }}
        />
        <input
          type="text"
          value={custom || value}
          onChange={e => {
            setCustom(e.target.value)
            if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
              onChange(e.target.value)
            }
          }}
          placeholder="#7c6af0"
          maxLength={7}
          className="input-base font-mono"
          style={{ flex: 1 }}
        />
      </div>
    </div>
  )
}
