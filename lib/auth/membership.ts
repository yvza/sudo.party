import { turso } from "@/lib/turso";
import { getRequiredMembershipForSlug } from "@/lib/posts-meta";

/** Rank required for a given post slug, from membership_types via frontmatter.slug */
export async function requiredRankForPost(slug: string): Promise<number> {
  const membershipSlug = getRequiredMembershipForSlug(slug) ?? "public";
  const rs = await turso.execute({
    sql: `SELECT rank FROM membership_types WHERE slug = ?`,
    args: [membershipSlug],
  });
  return (rs.rows[0]?.rank as number) ?? 1;
}

/** User rank by wallet address; does NOT create a wallet row */
export async function userRankForAddress(addressLower: string): Promise<number> {
  const rs = await turso.execute({
    sql: `SELECT mt.rank AS rank
          FROM wallets w
          LEFT JOIN membership_types mt ON mt.id = w.membership_type_id
          WHERE w.address = ?`,
    args: [addressLower],
  });
  if (rs.rows.length) return (rs.rows[0].rank as number) ?? 1;

  // fallback to default membership rank
  const def = await turso.execute({
    sql: `SELECT rank FROM membership_types WHERE is_default = 1 LIMIT 1`,
  });
  return (def.rows[0]?.rank as number) ?? 1;
}
