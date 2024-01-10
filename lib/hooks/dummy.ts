import useSWR from 'swr'
import { fetcher } from '../api'

export const useUnicorn = () => {
  const pathKey = '/api/submit'
  const {data, error} = useSWR(pathKey, fetcher)

  return { data: data || [], loading: !error && !data, error }
}