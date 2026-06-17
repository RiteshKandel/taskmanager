import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import api from '../api'
import { notify } from '@/lib/toast'

// ── Types ─────────────────────────────────────────────────────────────────────
export type ForumPost = {
  id: number
  author: {
    id: number
    name: string
    email: string
    avatar: string | null
    avatar_url: string | null
  }
  content: string
  mention_ids: number[]
  project: number | null
  created_at: string
}

export type MatrixUser = {
  id: number
  name: string
  email: string
  avatar_url: string | null
  projects: {
    id: number
    title: string
    color: string
    role: string
  }[]
}

// ── Forum hooks ───────────────────────────────────────────────────────────────

/**
 * Fetch forum posts — global (no projectId) or project-scoped.
 */
export function useForumPosts(projectId?: number) {
  return useInfiniteQuery({
    queryKey: ['forum-posts', projectId ?? 'global'],
    queryFn: ({ pageParam = 1 }) => {
      const params: Record<string, any> = { page: pageParam }
      if (projectId) params.project = projectId
      return api.get('/forum/', { params }).then(r => r.data)
    },
    getNextPageParam: (lastPage: any) => {
      if (!lastPage.next) return undefined
      const url = new URL(lastPage.next)
      return Number(url.searchParams.get('page'))
    },
    initialPageParam: 1,
  })
}

/**
 * Create a forum post — global or project-scoped.
 */
export function useCreateForumPost(projectId?: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (content: string) =>
      api.post('/forum/', {
        content,
        ...(projectId ? { project_id: projectId } : {}),
      }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forum-posts', projectId ?? 'global'] })
    },
    onError: () => notify.error('Failed to post message'),
  })
}

/**
 * Delete a forum post.
 */
export function useDeleteForumPost(projectId?: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (postId: number) =>
      api.delete(`/forum/${postId}/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forum-posts', projectId ?? 'global'] })
    },
    onError: () => notify.error('Failed to delete post'),
  })
}

// ── Member-Project Matrix hook ────────────────────────────────────────────────

/**
 * Fetch member-project matrix — global (no projectId) or project-scoped.
 */
export function useMemberMatrix(projectId?: number) {
  return useQuery({
    queryKey: ['member-matrix', projectId ?? 'global'],
    queryFn: () => {
      const params: Record<string, any> = {}
      if (projectId) params.project = projectId
      return api.get('/member-matrix/', { params }).then(r => r.data as MatrixUser[])
    },
    refetchInterval: 30000,
  })
}
