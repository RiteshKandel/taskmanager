import { useEffect } from 'react'

type ShortcutMap = Record<string, () => void>

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.key) return

      // Don't fire when user is typing in a form field
      const target = e.target as HTMLElement
      const tag = target.tagName?.toLowerCase() || ''
      const isEditing = ['input', 'textarea', 'select'].includes(tag)
        || target.isContentEditable

      // Build the key combo string: "ctrl+k", "shift+n", "1", etc.
      // Use Ctrl on Windows (ctrlKey), Cmd on Mac (metaKey) — unified as "ctrl"
      const parts: string[] = []
      if (e.ctrlKey || e.metaKey) parts.push('ctrl')
      if (e.shiftKey)             parts.push('shift')
      if (e.altKey)               parts.push('alt')
      parts.push(e.key.toLowerCase())

      const combo = parts.join('+')

      // Ctrl+K fires even when editing (global search)
      if (combo === 'ctrl+k') {
        e.preventDefault()
        shortcuts['ctrl+k']?.()
        return
      }

      // All other shortcuts: skip if user is typing
      if (isEditing) return

      if (shortcuts[combo]) {
        e.preventDefault()
        shortcuts[combo]()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [shortcuts])
}
