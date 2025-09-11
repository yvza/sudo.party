type Membership = 'public'|'supporter'|'sudopartypass'
type Reason = 'LOGIN_REQUIRED'|'INSUFFICIENT_MEMBERSHIP'|'NOT_FOUND'|'UNKNOWN'

export type ApiError = {
  status: number
  error?: string
  reason?: Reason
  message?: string
  required?: Membership
  userMembership?: Membership
}

const label: Record<Membership, string> = {
  public: 'Public',
  supporter: 'Supporter',
  sudopartypass: 'Sudo Party Pass',
}

export function humanizeError(e: ApiError) {
  // Prefer server message when present
  if (e.reason === 'LOGIN_REQUIRED') {
    return {
      title: 'Sign in required',
      desc: e.message ?? 'Please sign in with your wallet to access this content.',
      action: { kind: 'login', label: 'Sign In' },
    }
  }
  if (e.reason === 'INSUFFICIENT_MEMBERSHIP') {
    return {
      title: 'Membership required',
      desc:
        e.message ??
        `This post requires ${label[e.required ?? 'public']} membership or higher.`,
      action: { kind: 'upgrade', label: 'View membership options' },
    }
  }
  if (e.status === 404 || e.reason === 'NOT_FOUND') {
    return { title: 'Post not found', desc: 'This post may have been moved or deleted.' }
  }
  if (e.status === 400) {
    return { title: 'Bad request', desc: 'The request could not be processed.' }
  }
  return { title: 'Something went wrong', desc: 'Please try again later.' }
}