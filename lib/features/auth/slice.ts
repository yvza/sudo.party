// lib/features/auth/slice.ts
import { createSlice, PayloadAction, createAction } from '@reduxjs/toolkit'

export type Membership = 'public' | 'supporter' | 'sudopartypass'

export type AuthState = {
  isLoggedIn: boolean
  address: string | null
  membership: Membership
  rank: number
  pk: number | null          // numeric DB id; new
  status: 'idle' | 'loading' | 'error'
  error?: string | null
  sessionEpoch: number
  /** NEW: true when the auth session (hydrate) has finished (success or fail) */
  sessionReady: boolean
}

// Try to restore from localStorage for instant UI (no skeleton flash)
function getPersistedAuthHint(): Partial<AuthState> {
  if (typeof window === 'undefined') return {}
  try {
    const stored = localStorage.getItem('auth_hint')
    if (stored) {
      const parsed = JSON.parse(stored)
      // Only use hint if it's recent (within 24 hours)
      if (parsed.ts && Date.now() - parsed.ts < 24 * 60 * 60 * 1000) {
        return {
          isLoggedIn: parsed.isLoggedIn ?? false,
          address: parsed.address ?? null,
          membership: parsed.membership ?? 'public',
          rank: parsed.rank ?? 1,
          // Mark as "hinted" but not ready - still need server validation
          sessionReady: false,
        }
      }
    }
  } catch {}
  return {}
}

// Save auth hint to localStorage for next page load
export function persistAuthHint(state: Pick<AuthState, 'isLoggedIn' | 'address' | 'membership' | 'rank'>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('auth_hint', JSON.stringify({
      isLoggedIn: state.isLoggedIn,
      address: state.address,
      membership: state.membership,
      rank: state.rank,
      ts: Date.now(),
    }))
  } catch {}
}

export function clearAuthHint() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem('auth_hint')
  } catch {}
}

const persistedHint = getPersistedAuthHint()

const initialState: AuthState = {
  isLoggedIn: persistedHint.isLoggedIn ?? false,
  address: persistedHint.address ?? null,
  membership: persistedHint.membership ?? 'public',
  rank: persistedHint.rank ?? 1,
  pk: null,
  status: 'idle',
  error: null,
  sessionEpoch: 0,
  sessionReady: false, // Still need server validation
}

/** Actions that sagas will listen for (dispatched from the UI) */
export const siweVerifyRequested = createAction<{
  message: string
  signature: string
  remember?: boolean
  signedAt?: number
}>('auth/siweVerifyRequested')

export const sessionHydrateRequested = createAction('auth/sessionHydrateRequested')
export const logoutRequested = createAction('auth/logoutRequested')

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authSet(state, action: PayloadAction<Partial<AuthState>>) {
      Object.assign(state, action.payload)
    },

    // used by saga results
    siweVerifySucceeded(
      state,
      action: PayloadAction<{ address: string; membership: Membership; rank: number; pk?: number | null }>
    ) {
      const prev = { addr: state.address, mem: state.membership, rank: state.rank }
      state.isLoggedIn = true
      state.address = action.payload.address
      state.membership = action.payload.membership
      state.rank = action.payload.rank
      state.pk = action.payload.pk ?? null

      // bump epoch if anything meaningful changed
      if (prev.addr !== state.address || prev.mem !== state.membership || prev.rank !== state.rank) {
        state.sessionEpoch += 1
      }

      state.status = 'idle'
      state.error = null
      state.sessionReady = true // NEW: we now know the session state
    },

    siweVerifyFailed(state, action: PayloadAction<string>) {
      state.status = 'error'
      state.error = action.payload
      // don't touch sessionReady here; SIWE is an explicit flow
    },

    // EDITED: mark sessionReady=true on hydrate success
    sessionHydrateSucceeded(
      state,
      action: PayloadAction<{
        isLoggedIn: boolean
        address: string | null
        membership: Membership
        rank: number
        pk: number | null
      }>
    ) {
      const prev = { addr: state.address, mem: state.membership, rank: state.rank }
      Object.assign(state, action.payload)
      if (prev.addr !== state.address || prev.mem !== state.membership || prev.rank !== state.rank) {
        state.sessionEpoch += 1
      }
      state.status = 'idle'
      state.error = null
      state.sessionReady = true // NEW
    },

    // NEW: hydrate failed (e.g., 401 or network); still mark ready
    sessionHydrateFailed(state, action: PayloadAction<string | undefined>) {
      state.status = 'idle'          // hydrate completed (even if failed)
      state.error = action.payload ?? null
      state.sessionReady = true
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
      state.sessionReady = true // session is definitively known post-logout
    },
  },

  // Handle external (createAction) events that should mutate state
  extraReducers: (builder) => {
    builder.addCase(sessionHydrateRequested, (state) => {
      state.status = 'loading'
      state.error = null
      state.sessionReady = false
    })
    // Note: siweVerifyRequested/logoutRequested are handled by sagas; no local state change here.
  },
})

// Export slice actions
export const {
  authSet,
  siweVerifySucceeded,
  siweVerifyFailed,
  sessionHydrateSucceeded,
  sessionHydrateFailed, // NEW
  logoutSucceeded,
} = slice.actions

export default slice.reducer