import axios from 'axios'
import { useQuery } from '@tanstack/react-query'

export const getArticles = async () => {
  const response = await axios.get('/api/articles')
  return response.data
}

export const useArticles = () => {
  return useQuery({
    queryKey: ['getArticles'],
    queryFn: getArticles,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 3
  })
}