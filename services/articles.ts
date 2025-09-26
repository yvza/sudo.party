import axios from 'axios'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import type { RootState } from '@/lib/store'

export type GetArticlesParams = {
  page?: number
  limit?: number
  tag?: string
  search?: string
}

export const getArticles = async (params?: GetArticlesParams) => {
  const res = await axios.get('/api/articles', { params, withCredentials: true })
  return res.data as { total: number; page: number; limit: number; data: any[] }
}

export const getArticle = async (slug: string) => {
  const res = await axios.get(`/api/articles/${slug}`, { withCredentials: true })
  return res.data
}

export const useArticles = (params?: GetArticlesParams) => {
  const epoch = useSelector((s: RootState) => s.auth.sessionEpoch)
  return useQuery({
    queryKey: ['articles', params ?? null, epoch],
    queryFn: () => getArticles(params),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60 * 24,
    retry: (count, err) => {
      if (axios.isAxiosError(err)) {
        const code = err.response?.status
        if (code === 401 || code === 403) return false
      }
      return count < 3
    },
    // If you ALSO don't want to persist the list, uncomment:
    // meta: { persist: false },
  })
}

export const useArticle = (slug?: string) => {
  const epoch = useSelector((s: RootState) => s.auth.sessionEpoch)
  return useQuery({
    queryKey: ['article', slug ?? null, epoch],
    queryFn: () => getArticle(slug as string),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60 * 24,
    retry: (count, err) => {
      if (axios.isAxiosError(err)) {
        const code = err.response?.status
        if (code === 401 || code === 403) return false
      }
      return count < 3
    },
    // Never persist sensitive post payloads
    meta: { persist: false },
  })
}