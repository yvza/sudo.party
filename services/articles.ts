import axios from 'axios'
import { useQuery } from '@tanstack/react-query'

export type GetArticlesParams = {
  page?: number;
  limit?: number;
  tag?: string;
  search?: string;
};

export const getArticles = async (params?: GetArticlesParams) => {
  const res = await axios.get('/api/articles', { params });
  return res.data as { total: number; page: number; limit: number; data: any[] };
};

export const getArticle = async (slug: string) => {
  const res = await axios.get(`/api/articles/${slug}`);
  return res.data;
};

export const useArticles = (params?: GetArticlesParams) => {
  return useQuery({
    queryKey: ['articles', params ?? null],
    queryFn: () => getArticles(params),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 3
  })
}

export const useArticle = (slug?: string) => {
  return useQuery({
    queryKey: ['article', slug],
    queryFn: () => getArticle(slug as string),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60 * 24,
    retry: (count, err) => {
      if (axios.isAxiosError(err) && err.response?.status === 401) return false;
      return count < 3;
    }
  })
}
