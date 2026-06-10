import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import api from '../api'

export type SearchTask = {
  id:            number
  title:         string
  project_id:    number
  project_title: string
  priority:      number
  status:        string
}
export type SearchProject = {
  id:    number
  title: string
  color: string
}
export type SearchResults = {
  tasks:    SearchTask[]
  projects: SearchProject[]
}

export function useSearch(query: string) {
  const [debounced, setDebounced] = useState(query)

  // Debounce 250ms — only call API when user stops typing
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 250)
    return () => clearTimeout(t)
  }, [query])

  return useQuery({
    queryKey: ['search', debounced],
    queryFn: () =>
      api.get(`/search/?q=${encodeURIComponent(debounced)}`).then(r => r.data as SearchResults),
    enabled:          debounced.length >= 2,
    staleTime:        15_000,
    placeholderData:  { tasks: [], projects: [] },
  })
}
