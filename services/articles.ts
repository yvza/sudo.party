import { api, isFetchError } from '@/utils/fetcher'
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
  return api.get<{ total: number; page: number; limit: number; data: any[] }>('/api/articles', { params })
}

export const getArticle = async (slug: string) => {
  return api.get(`/api/articles/${slug}`)
}

export const useArticles = (params?: GetArticlesParams) => {
  const epoch = useSelector((s: RootState) => s.auth.sessionEpoch)
  return useQuery({
    queryKey: ['articles', params ?? null, epoch],
    queryFn: () => getArticles(params),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60 * 24,
    retry: (count, err) => {
      if (isFetchError(err)) {
        const code = err.status
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
      if (isFetchError(err)) {
        const code = err.status
        if (code === 401 || code === 403) return false
      }
      return count < 3
    },
    // Never persist sensitive post payloads
    meta: { persist: false },
  })
}