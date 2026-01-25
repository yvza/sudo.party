import { turso } from "@/lib/turso";
import { getRequiredMembershipForSlug } from "@/lib/posts-meta";

/** Rank required for a given post slug, from membership_types via frontmatter.slug */
export async function requiredRankForPost(slug: string): Promise<number> {
  const membershipSlug = getRequiredMembershipForSlug(slug) ?? "public";
  const rs = await turso.execute({
    sql: `SELECT rank FROM membership_types WHERE slug = ?`,
    args: [membershipSlug],
  });
  const rank = (rs.rows[0]?.rank as number) ?? 1;
  console.log(`[requiredRankForPost] slug=${slug}, membershipSlug=${membershipSlug}, rank=${rank}`);
  return rank;
}

/** User rank by wallet address; does NOT create a wallet row */
export async function userRankForAddress(addressLower: string): Promise<number> {
  const rs = await turso.execute({
    sql: `SELECT
            w.membership_type_id,
            mt.rank AS rank,
            mt.slug AS membership_slug,
            w.membership_expires_at AS expires_at
          FROM wallets w
          LEFT JOIN membership_types mt ON mt.id = w.membership_type_id
          WHERE w.address = ?`,
    args: [addressLower],
  });

  console.log(`[userRankForAddress] address=${addressLower}, rows=`, JSON.stringify(rs.rows));

  // Helper to read default/public rank
  async function defaultRank(): Promise<number> {
    const def = await turso.execute({
      sql: `SELECT rank FROM membership_types WHERE is_default = 1 LIMIT 1`,
    });
    return (def.rows[0]?.rank as number) ?? 1;
  }

  if (!rs.rows.length) {
    console.log(`[userRankForAddress] No wallet found, returning default`);
    return await defaultRank();
  }

  const row = rs.rows[0] as any;
  const rank = (row.rank as number) ?? 1;
  const exp = row.expires_at as string | number | null | undefined;

  console.log(`[userRankForAddress] membership_type_id=${row.membership_type_id}, rank=${rank}, expires_at=${exp}`);

  // If there is an expiry and it's in the past → treat as public/default
  // Note: expires_at is stored as Unix seconds, convert to milliseconds for Date
  if (exp) {
    const expSeconds = Number(exp);
    const expMs = expSeconds * 1000;
    const now = Date.now();
    console.log(`[userRankForAddress] expMs=${expMs}, now=${now}, expired=${expMs <= now}`);
    if (!isNaN(expMs) && expMs <= now) {
      console.log(`[userRankForAddress] Membership expired, returning default`);
      return await defaultRank();
    }
  }

  console.log(`[userRankForAddress] Returning rank=${rank}`);
  return rank;
}
