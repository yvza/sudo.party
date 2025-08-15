// pages/api/comments/[slug].ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { turso } from '@/lib/turso'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const slug = String(req.query.slug ?? '')
  if (!slug) return res.status(400).json({ error: 'missing slug' })

  const limit = Math.min(parseInt(String(req.query.limit ?? '50'), 10) || 50, 200)
  const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10) || 0, 0)

  const { rows } = await turso.execute({
    sql: `
      SELECT c.id, c.content, c.parent_id, c.created_at,
             w.address AS author_address,
             mt.slug  AS author_membership
      FROM comments c
      JOIN wallets w ON w.id = c.wallet_id
      LEFT JOIN membership_types mt ON mt.id = w.membership_type_id
      WHERE c.post_slug = ? AND c.is_deleted = 0 AND c.is_approved = 1
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `,
    args: [slug, limit, offset],
  })

  return res.status(200).json({ slug, comments: rows })
}