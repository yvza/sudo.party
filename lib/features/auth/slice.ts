import { createSlice, PayloadAction, createAction } from '@reduxjs/toolkit'

export type Membership = 'public' | 'sgbcode' | 'sudopartypass'

export type AuthState = {
  isLoggedIn: boolean
  address: string | null
  membership: Membership
  rank: number
  pk: number | null          // numeric DB id; new
  status: 'idle' | 'loading' | 'error'
  error?: string | null
  sessionEpoch: number
}

const initialState: AuthState = {
  isLoggedIn: false,
  address: null,
  membership: 'public',
  rank: 1,
  pk: null,
  status: 'idle',
  error: null,
  sessionEpoch: 0
}

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authSet(state, action: PayloadAction<Partial<AuthState>>) {
      Object.assign(state, action.payload)
    },
    // used by saga results
    siweVerifySucceeded(state, action: PayloadAction<{ address: string; membership: Membership; rank: number; pk?: number | null }>) {
      const prev = { addr: state.address, mem: state.membership, rank: state.rank }
      state.isLoggedIn = true
      state.address = action.payload.address
      state.membership = action.payload.membership
      state.rank = action.payload.rank
      state.pk = action.payload.pk ?? null

      // bump epoch if anything meaningful changed
      if (
        prev.addr !== state.address ||
        prev.mem !== state.membership ||
        prev.rank !== state.rank
      ) {
        state.sessionEpoch += 1
      }

      state.status = 'idle'
      state.error = null
    },
    siweVerifyFailed(state, action: PayloadAction<string>) {
      state.status = 'error'
      state.error = action.payload
    },
    sessionHydrateSucceeded(state, action: PayloadAction<{ isLoggedIn: boolean; address: string | null; membership: Membership; rank: number; pk: number | null }>) {
      const prev = { addr: state.address, mem: state.membership, rank: state.rank }
      Object.assign(state, action.payload)
      if (
        prev.addr !== state.address ||
        prev.mem !== state.membership ||
        prev.rank !== state.rank
      ) {
        state.sessionEpoch += 1
      }
      state.status = 'idle'
      state.error = null
    },
    logoutSucceeded(state) {
      // bump so public cache is different from previous member cache
      state.isLoggedIn = false
      state.address = null
      state.membership = 'public'
      state.rank = 1
      state.pk = null
      state.sessionEpoch += 1
      state.status = 'idle'
      state.error = null
    },
  },
})

// Actions that sagas will listen for (dispatched from the UI)
export const siweVerifyRequested = createAction<{ message: string; signature: string }>('auth/siweVerifyRequested')
export const sessionHydrateRequested = createAction('auth/sessionHydrateRequested')
export const logoutRequested = createAction('auth/logoutRequested')

export const { authSet, siweVerifySucceeded, siweVerifyFailed, sessionHydrateSucceeded, logoutSucceeded } = slice.actions
export default slice.reducer