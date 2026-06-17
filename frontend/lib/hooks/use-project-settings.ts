import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api'

// ── Personal per-project settings (mute toggle) ────────────────
export function useMySettings(projectId: number) {
  return useQuery({
    queryKey: ['my-settings', projectId],
    queryFn:  () => api.get(`/projects/${projectId}/my-settings/`).then(r => r.data),
    enabled:  !!projectId,
  })
}

export function useUpdateMySettings(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { notifications_muted: boolean }) =>
      api.patch(`/projects/${projectId}/my-settings/`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-settings', projectId] }),
  })
}

// ── Transfer ownership ──────────────────────────────────────────
export function useTransferOwnership(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (newOwnerId: number) =>
      api.post(`/projects/${projectId}/transfer-ownership/`, { new_owner_id: newOwnerId })
        .then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['my-role', projectId] })
      qc.invalidateQueries({ queryKey: ['members', projectId] })
    },
  })
}
