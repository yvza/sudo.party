export const MembershipRank = {
  public: 1,
  sgbcode: 2,
  sudopartypass: 3,
} as const

export type MembershipSlug = keyof typeof MembershipRank

export function requiredRankFor(slug: MembershipSlug) {
  return MembershipRank[slug] ?? 1
}

export function canView(userRank: number, requiredSlug: MembershipSlug) {
  return userRank >= requiredRankFor(requiredSlug)
}