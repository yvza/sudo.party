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
    sql: `SELECT
            mt.rank AS rank,
            w.membership_expires_at AS expires_at
          FROM wallets w
          LEFT JOIN membership_types mt ON mt.id = w.membership_type_id
          WHERE w.address = ?`,
    args: [addressLower],
  });

  // Helper to read default/public rank
  async function defaultRank(): Promise<number> {
    const def = await turso.execute({
      sql: `SELECT rank FROM membership_types WHERE is_default = 1 LIMIT 1`,
    });
    return (def.rows[0]?.rank as number) ?? 1;
  }

  if (!rs.rows.length) return await defaultRank();

  const row = rs.rows[0] as any;
  const rank = (row.rank as number) ?? 1;
  const exp = row.expires_at as string | number | null | undefined;

  // If there is an expiry and it's in the past → treat as public/default
  // Note: expires_at is stored as Unix seconds, convert to milliseconds for Date
  // If there is an expiry and it's in the past → treat as public/default
  // Note: expires_at is stored as Unix seconds, convert to milliseconds for Date
  if (exp) {
    const expMs = Number(exp) * 1000;
    if (!isNaN(expMs) && expMs <= Date.now()) {
      return await defaultRank();
    }
  }

  return rank;
}
