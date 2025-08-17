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

    // NEW: set iron-session TTL metadata (remember/lastSignedAt) via /api/auth
    // Safe reads in case the slice type wasn't updated yet:
    const remember = Boolean((action as any)?.payload?.remember)
    const signedAt = typeof (action as any)?.payload?.signedAt === 'number'
      ? (action as any).payload.signedAt
      : Date.now()
    const identifier = String(data.address || '').toLowerCase()
    if (!identifier) throw new Error('Missing wallet address from verify response')
    // If your accounts.pk is numeric and returned in data.pk, prefer that; else reuse the address
    const pkForAccount = (typeof data.pk === 'number' && Number.isInteger(data.pk) && data.pk > 0)
      ? data.pk
      : identifier
    yield call(axios.post, '/api/auth', {
      pk: pkForAccount,
      identifier,
      type: 'wallet',
      remember,
      signedAt,
    })

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
    const resp: AxiosResponse<{
      authenticated: boolean;
      address: string | null;
      membership: { slug: 'public'|'sgbcode'|'sudopartypass'; name: string; rank: number } | null;
    }> = yield call(axios.get, '/api/me')
    const me = resp.data
    yield put(sessionHydrateSucceeded({
      isLoggedIn: !!me.authenticated,
      address: me.address,
      membership: me.membership?.slug ?? 'public',
      rank: me.membership?.rank ?? 1,
      pk: null,
    }))
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
    yield call(axios.delete, '/api/auth')
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