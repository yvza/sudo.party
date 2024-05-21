import useSWR from 'swr'
import { fetcher } from '../api'

export const useUnicorn = () => {
  const pathKey = '/api/articles'
  const { data, error } = useSWR(pathKey, fetcher)

  return { data: data || [], loading: !error && !data, error }
}

export const getArticles = () => {
  const pathKey = '/api/articles'
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { data, error, isValidating, isLoading } = useSWR(pathKey, fetcher)

  return { data: data || [], error, isValidating, isLoading }
}