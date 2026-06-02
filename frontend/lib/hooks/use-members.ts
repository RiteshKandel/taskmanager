import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api'

export type Role = 'owner' | 'admin' | 'editor' | 'viewer'

export type Member = {
  id: number
  user: { id: number; name: string; email: string; avatar: string | null }
  role: Role
  added_at: string
}

export function useMembers(projectId: number) {
  return useQuery({
    queryKey: ['members', projectId],
    queryFn: () =>
      api.get(`/projects/${projectId}/members/`).then(r => {
        // Normalise: handle plain array or DRF paginated envelope {results: [...]}
        const raw = r.data
        return (Array.isArray(raw) ? raw : (raw?.results ?? [])) as Member[]
      }),
    enabled: !!projectId,
  })
}

export function useMyRole(projectId: number) {
  return useQuery({
    queryKey: ['my-role', projectId],
    queryFn: () => api.get(`/projects/${projectId}/my-role/`).then(r => r.data.role as Role),
    enabled: !!projectId,
  })
}

export function usePermissions(projectId: number) {
  const { data: role } = useMyRole(projectId)
  return {
    role,
    canView:   !!role,
    canEdit:   ['owner', 'admin', 'editor'].includes(role ?? ''),
    canManage: ['owner', 'admin'].includes(role ?? ''),
    canDelete: role === 'owner',
    isOwner:   role === 'owner',
  }
}

export function useAddMember(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { email: string; role: Role }) =>
      api.post(`/projects/${projectId}/members/`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', projectId] }),
  })
}

export function useUpdateMemberRole(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: number; role: Role }) =>
      api.patch(`/projects/${projectId}/members/${memberId}/`, { role }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', projectId] }),
  })
}

export function useRemoveMember(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (memberId: number) =>
      api.delete(`/projects/${projectId}/members/${memberId}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', projectId] }),
  })
}
