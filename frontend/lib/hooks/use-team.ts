import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api'

export type TeamMember = {
  id:              number
  name:            string
  email:           string
  avatar:          string | null
  projects:        { id: number; title: string; color: string; role: string }[]
  open_task_count: number
  current_tasks:   string[]
}

export type ChannelMessage = {
  id:         number
  body:       string
  author:     { id: number; name: string; email: string; avatar: string | null }
  is_mine:    boolean
  created_at: string
}

// ── "Who's working on what" board ──────────────────────────────────────────
export function useTeamOverview() {
  return useQuery({
    queryKey: ['team-overview'],
    queryFn:  () => api.get('/team/overview/').then(r => r.data.members as TeamMember[]),
    refetchInterval: 30_000,   // refresh every 30s — feels alive without WebSockets
  })
}

// ── Derive the channel list from team overview data ─────────────────────────
// Each member already lists their projects; we invert that into
// project → list of members. No extra API call needed.
export function groupProjectsFromMembers(members: TeamMember[]) {
  const map = new Map<number, {
    id: number; title: string; color: string
    members: { id: number; name: string; avatar: string | null }[]
  }>()

  for (const m of members) {
    for (const p of m.projects) {
      if (!map.has(p.id)) {
        map.set(p.id, { id: p.id, title: p.title, color: p.color, members: [] })
      }
      map.get(p.id)!.members.push({ id: m.id, name: m.name, avatar: m.avatar })
    }
  }
  return Array.from(map.values())
}

// ── Chat messages for one project channel ───────────────────────────────────
export function useProjectMessages(projectId: number | null) {
  return useQuery({
    queryKey: ['messages', projectId],
    queryFn:  () => api.get(`/projects/${projectId}/messages/`).then(r => r.data as ChannelMessage[]),
    enabled:  !!projectId,
    refetchInterval: 5_000,    // poll every 5s — simulates live chat without WebSockets
  })
}

export function usePostMessage(projectId: number | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: string) =>
      api.post(`/projects/${projectId}/messages/`, { body }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages', projectId] }),
  })
}

export function useDeleteMessage(projectId: number | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (messageId: number) =>
      api.delete(`/projects/${projectId}/messages/${messageId}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages', projectId] }),
  })
}
