import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api'

export type Reminder = {
  id:            number
  task:          number
  reminder_time: string
  sent:          boolean
}

export function useReminder(taskId: number) {
  return useQuery({
    queryKey: ['reminder', taskId],
    queryFn: () => api.get(`/tasks/${taskId}/reminder/`).then(r => r.data as Reminder[]),
    enabled: !!taskId,
  })
}

export function useSetReminder(taskId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reminder_time: string) =>
      api.post(`/tasks/${taskId}/reminder/`, { reminder_time }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminder', taskId] }),
  })
}

export function useDeleteReminder(taskId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reminderId: number) => api.delete(`/tasks/${taskId}/reminder/${reminderId}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminder', taskId] }),
  })
}
