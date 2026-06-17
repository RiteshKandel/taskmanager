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

export function useForumPosts() {
  return useInfiniteQuery({
    queryKey: ['forum-posts'],
    queryFn: ({ pageParam = 1 }) =>
      api.get('/forum/', { params: { page: pageParam } }).then(r => r.data),
    getNextPageParam: (lastPage: any) => {
      if (!lastPage.next) return undefined
      // Extract page number from the next URL
      const url = new URL(lastPage.next)
      return Number(url.searchParams.get('page'))
    },
    initialPageParam: 1,
  })
}

export function useCreateForumPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (content: string) =>
      api.post('/forum/', { content }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forum-posts'] })
    },
    onError: () => notify.error('Failed to post message'),
  })
}

export function useDeleteForumPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (postId: number) =>
      api.delete(`/forum/${postId}/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forum-posts'] })
    },
    onError: () => notify.error('Failed to delete post'),
  })
}

// ── Member-Project Matrix hook ────────────────────────────────────────────────

export function useMemberMatrix() {
  return useQuery({
    queryKey: ['member-matrix'],
    queryFn: () => api.get('/member-matrix/').then(r => r.data as MatrixUser[]),
    refetchInterval: 30000, // auto-refresh every 30 seconds
  })
}
