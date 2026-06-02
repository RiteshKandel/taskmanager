import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api'

// Flat project shape returned by the list and detail endpoints
export type Project = {
  id: number; title: string; color: string; icon: string
  task_count: number; position: number; parent: number | null
  is_archived: boolean; owner_name: string
}

// Recursive tree node returned by GET /api/projects/tree/
export type ProjectTree = {
  id: number
  title: string
  color: string
  icon: string
  position: number
  parent: number | null
  is_archived: boolean
  task_count: number
  owner_name: string
  my_role: string
  subprojects: ProjectTree[]
}

// Shape returned by GET /api/projects/flat/
export type ProjectFlat = {
  id: number
  title: string
  path: string   // e.g. "Design / UI Components"
  color: string
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects/').then(r => (r.data.results !== undefined ? r.data.results : r.data) as Project[]),
  })
}

export function useProject(id: number) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => api.get(`/projects/${id}/`).then(r => r.data),
    enabled: !!id,
  })
}

export function useProjectTree() {
  return useQuery({
    queryKey: ['projects', 'tree'],
    queryFn: () => api.get('/projects/tree/').then(r => r.data as ProjectTree[]),
  })
}

export function useProjectsFlat(search: string) {
  return useQuery({
    queryKey: ['projects', 'flat', search],
    queryFn: () => api.get(`/projects/flat/?search=${encodeURIComponent(search)}`).then(r => r.data as ProjectFlat[]),
    staleTime: 30_000,
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { title: string; color?: string; parent?: number | null }) =>
      api.post('/projects/', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Project> & { id: number }) =>
      api.patch(`/projects/${id}/`, data).then(r => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['projects', vars.id] })
    },
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/projects/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}