import { call, put, takeLatest } from 'redux-saga/effects'
import type { SagaIterator } from 'redux-saga'
import axios, { AxiosResponse } from 'axios'
import {
  siweVerifyRequested,
  siweVerifySucceeded,
  siweVerifyFailed,
  sessionHydrateRequested,
  sessionHydrateSucceeded,
  logoutRequested,
  logoutSucceeded,
} from './slice'
import { hideAlertDialog } from '@/lib/features/alertDialog/toggle'
import { queryClient } from '@/lib/react-query/client'

axios.defaults.withCredentials = true

type Membership = 'public' | 'sgbcode' | 'sudopartypass'

type VerifyResponse = {
  isLoggedIn: boolean
  address: string
  membership: Membership
  rank: number
  pk?: number | null
}

type SessionResponse = {
  isLoggedIn: boolean
  address: string | null
  membership: Membership
  rank: number
  pk: number | null
}

const isArticleKey = (q: { queryKey: unknown }) => {
  const arr = q && Array.isArray((q as any).queryKey) ? (q as any).queryKey as unknown[] : []
  const root = arr[0]
  return root === 'article' || root === 'articles'
}

function* verifyWorker(action: ReturnType<typeof siweVerifyRequested>): SagaIterator {
  try {
    const resp: AxiosResponse<VerifyResponse> = yield call(axios.post, '/api/siwe/verify', action.payload)
    const data = resp.data
    if (!data?.isLoggedIn) throw new Error('Not logged in')

    // update auth (this should bump sessionEpoch in your reducer)
    yield put(siweVerifySucceeded({
      address: data.address,
      membership: data.membership,
      rank: data.rank,
      pk: data.pk ?? null,
    }))

    // clear article caches from previous epoch
    queryClient.removeQueries({ predicate: isArticleKey })
    // (optional) eagerly refetch active ones in the new epoch
    // queryClient.refetchQueries({ predicate: isArticleKey, type: 'active' })

    // Close the dialog on success
    yield put(hideAlertDialog())
  } catch (err: any) {
    yield put(siweVerifyFailed(err?.message ?? 'SIWE verify failed'))
  }
}

function* hydrateWorker(): SagaIterator {
  try {
    const resp: AxiosResponse<SessionResponse> = yield call(axios.get, '/api/session')
    yield put(sessionHydrateSucceeded(resp.data))
  } catch {
    yield put(sessionHydrateSucceeded({
      isLoggedIn: false,
      address: null,
      membership: 'public',
      rank: 1,
      pk: null,
    }))
  }
}

function* logoutWorker(): SagaIterator {
  try {
    yield call(axios.post, '/api/logout', {})
  } finally {
    // reducer should bump sessionEpoch here
    yield put(logoutSucceeded())

    // clear article caches from previous epoch
    queryClient.removeQueries({ predicate: isArticleKey })
    // (optional)
    // queryClient.refetchQueries({ predicate: isArticleKey, type: 'active' })
  }
}

export function* authSaga(): SagaIterator {
  yield takeLatest(siweVerifyRequested.type, verifyWorker)
  yield takeLatest(sessionHydrateRequested.type, hydrateWorker)
  yield takeLatest(logoutRequested.type, logoutWorker)
}