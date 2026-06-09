'use client'
import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { notify } from '@/lib/toast'

// Helpers
const formatSize = (bytes: number) => {
  if (bytes < 1024)     return bytes + ' B'
  if (bytes < 1048576)  return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

const fileIcon = (contentType: string) => {
  if (contentType.startsWith('image/'))       return '🖼️'
  if (contentType.includes('pdf'))            return '📄'
  if (contentType.includes('spreadsheet'))    return '📊'
  if (contentType.includes('zip') || contentType.includes('rar')) return '🗜️'
  return '📎'
}

interface Props { taskId: number; canEdit: boolean }

export function TaskAttachments({ taskId, canEdit }: Props) {
  const qc = useQueryClient()

  const { data: attachments = [] } = useQuery({
    queryKey: ['attachments', taskId],
    queryFn:  () => api.get(`/tasks/${taskId}/attachments/`).then(r => Array.isArray(r.data) ? r.data : (r.data.results ?? [])),
  })

  const upload = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return api.post(`/tasks/${taskId}/attachments/`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attachments', taskId] })
      notify.taskUpdated()
    },
    onError: (e: any) =>
      notify.error(e.response?.data?.file?.[0] || 'Upload failed'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/tasks/${taskId}/attachments/${id}/`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['attachments', taskId] }),
  })

  const onDrop = useCallback((files: File[]) => {
    files.forEach(f => upload.mutate(f))
  }, [upload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: !canEdit,
    maxSize:  1 * 1024 * 1024,   // 1 MB — matches backend validation
    multiple: true,
    onDropRejected: (files) => {
      files.forEach(({ errors }) => {
        const msg = errors[0]?.code === 'file-too-large'
          ? 'File exceeds 1 MB limit'
          : errors[0]?.message || 'File rejected'
        notify.error(msg)
      })
    },
  })

  return (
    <div>
      {/* Existing attachments */}
      {attachments.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {attachments.map((a: any) => (
            <div key={a.id}
              className="flex items-center gap-3 p-2.5 rounded-lg"
              style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)' }}>
              <div className="w-8 h-8 rounded-md flex items-center justify-center text-sm flex-shrink-0"
                style={{ background:'rgba(124,106,240,.1)' }}>
                {fileIcon(a.content_type)}
              </div>
              <div className="flex-1 min-w-0">
                <a href={a.file_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-medium block truncate hover:underline"
                  style={{ color:'var(--text-primary)' }}>
                  {a.filename}
                </a>
                <p className="text-[10px] mt-0.5" style={{ color:'var(--text-muted)' }}>
                  {formatSize(a.file_size)} · {a.uploaded_by.name}
                </p>
              </div>
              {canEdit && (
                <button onClick={() => remove.mutate(a.id)}
                  className="text-xs transition-colors flex-shrink-0"
                  style={{ color:'var(--text-muted)' }}>✕</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload drop zone */}
      {canEdit && (
        <div {...getRootProps()}
          className="rounded-lg p-4 text-center cursor-pointer transition-all"
          style={{
            border: `1.5px dashed ${isDragActive ? 'var(--accent)' : 'var(--border-strong)'}`,
            background: isDragActive ? 'var(--accent-dim)' : 'transparent',
          }}>
          <input {...getInputProps()} />
          <p className="text-xs font-medium"
            style={{ color: isDragActive ? '#a89cf5' : 'var(--text-muted)' }}>
            {upload.isPending
              ? 'Uploading…'
              : isDragActive
              ? 'Drop to upload'
              : '📎 Drop files or click to upload · max 1 MB'}
          </p>
        </div>
      )}
    </div>
  )
}
