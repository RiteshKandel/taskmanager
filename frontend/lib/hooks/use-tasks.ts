import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api'
import { notify } from '@/lib/toast'

export type Task = {
  id: number; title: string; is_done: boolean; status: string
  priority: number; due_date: string | null; start_date: string | null; position: number
  assignees: unknown[]; labels: unknown[]; subtask_count: number
  parent: number | null; project: number; description: string
}

export function useTasks(projectId: number) {
  return useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => api.get(`/tasks/?project=${projectId}&parent=&ordering=position`).then(r => r.data.results !== undefined ? r.data.results : r.data),
    enabled: !!projectId,
  })
}

export function useAllTasks() {
  return useQuery({
    queryKey: ['tasks', 'all'],
    // Using is_done=False and ordering by due date/priority to show urgent tasks
    queryFn: () => api.get('/tasks/?is_done=False&ordering=due_date,-priority').then(r => r.data.results !== undefined ? r.data.results : r.data),
  })
}

export function useTask(id: number) {
  return useQuery({
    queryKey: ['tasks', 'detail', id],
    queryFn: () => api.get(`/tasks/${id}/`).then(r => r.data),
    enabled: !!id,
  })
}

export function useCreateTask(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Task>) => api.post('/tasks/', { ...data, project: projectId }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] })
      notify.taskCreated()
    },
    onError: () => notify.error('Failed to create task'),
  })
}

export function useUpdateTask(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Task> & { id: number }) =>
      api.patch(`/tasks/${id}/`, data).then(r => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] })
      qc.invalidateQueries({ queryKey: ['tasks', 'detail', vars.id] })
      // Only toast for explicit content updates, not checkbox/position-only changes
      if (vars.is_done === true) {
        notify.taskCompleted()
      } else if (vars.title !== undefined || vars.description !== undefined) {
        notify.taskUpdated()
      }
    },
    onError: () => notify.error(),
  })
}

export function useDeleteTask(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/tasks/${id}/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] })
      notify.taskDeleted()
    },
    onError: () => notify.error('Failed to delete task'),
  })
}
export function useBulkUpdateTasks(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (updates: { id: number; status?: string; position?: number }[]) =>
      api.post('/tasks/bulk-update/', updates).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
  })
}