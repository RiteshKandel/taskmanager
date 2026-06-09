'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import CodeBlock from '@tiptap/extension-code-block'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { useCallback } from 'react'

interface TiptapEditorProps {
  content:    string
  onChange:   (html: string) => void
  onBlur?:    () => void
  placeholder?: string
  editable?:  boolean
}

export function TiptapEditor({
  content, onChange, onBlur,
  placeholder = 'Add a description…',
  editable = true,
}: TiptapEditorProps) {

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false }),
      CodeBlock,
      TaskList.configure({ HTMLAttributes: { class: 'task-list' } }),
      TaskItem.configure({ nested: true }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    onBlur:   () => { onBlur?.() },
    editorProps: {
      attributes: { class: 'tiptap' },
    },
  })

  const ToolbarButton = useCallback(({
    onClick, active, title, children,
  }: {
    onClick: () => void; active?: boolean; title: string; children: React.ReactNode
  }) => (
    <button type="button" onClick={onClick} title={title}
      className="w-6 h-6 flex items-center justify-center rounded text-xs font-bold transition-colors"
      style={{
        background: active ? 'var(--bg-active)' : 'transparent',
        color:      active ? 'var(--text-primary)' : 'var(--text-muted)',
      }}>
      {children}
    </button>
  ), [])

  if (!editor) return null

  return (
    <div className="rounded-lg overflow-hidden"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>

      {editable && (
        <div className="flex flex-wrap items-center gap-0.5 p-1.5"
          style={{ borderBottom: '1px solid var(--border)' }}>

          {/* Text formatting */}
          <ToolbarButton title="Bold (Ctrl+B)"
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}>
            <b>B</b>
          </ToolbarButton>
          <ToolbarButton title="Italic (Ctrl+I)"
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}>
            <i>I</i>
          </ToolbarButton>
          <ToolbarButton title="Strikethrough"
            active={editor.isActive('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()}>
            <s>S</s>
          </ToolbarButton>
          <ToolbarButton title="Inline code"
            active={editor.isActive('code')}
            onClick={() => editor.chain().focus().toggleCode().run()}>
            <span style={{ fontFamily: 'monospace' }}>&lt;&gt;</span>
          </ToolbarButton>

          <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />

          {/* Headings */}
          <ToolbarButton title="Heading 2"
            active={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            H2
          </ToolbarButton>

          <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />

          {/* Lists */}
          <ToolbarButton title="Bullet list"
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}>
            ≡
          </ToolbarButton>
          <ToolbarButton title="Numbered list"
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            1.
          </ToolbarButton>
          <ToolbarButton title="Task list"
            active={editor.isActive('taskList')}
            onClick={() => editor.chain().focus().toggleTaskList().run()}>
            ☑
          </ToolbarButton>

          <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />

          {/* Code block and quote */}
          <ToolbarButton title="Code block"
            active={editor.isActive('codeBlock')}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
            ⌥
          </ToolbarButton>
          <ToolbarButton title="Blockquote"
            active={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            ❝
          </ToolbarButton>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  )
}
