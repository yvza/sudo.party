// @ts-ignore
import { NextResponse } from 'next/server'
import { turso } from '@/lib/turso'

export async function GET(_req: Request, { params }: { params: { address: string } }) {
  const addr = params.address.toLowerCase()

  const { rows } = await turso.execute({
    sql: `
      SELECT w.address, mt.slug, mt.name, mt.rank
      FROM wallets w
      LEFT JOIN membership_types mt ON mt.id = w.membership_type_id
      WHERE w.address = ?
      LIMIT 1
    `,
    args: [addr],
  })

  if (rows.length === 0) {
    // not registered yet: treat as default 'public'
    const def = await turso.execute(`SELECT slug, name, rank FROM membership_types WHERE is_default=1 LIMIT 1`)
    const d = def.rows[0] as any
    return NextResponse.json({ address: addr, membership: d })
  }

  const w = rows[0] as any
  // if somehow null, fall back to default
  if (!w.slug) {
    const def = await turso.execute(`SELECT slug, name, rank FROM membership_types WHERE is_default=1 LIMIT 1`)
    Object.assign(w, def.rows[0])
  }
  return NextResponse.json({ address: w.address, membership: { slug: w.slug, name: w.name, rank: w.rank } })
}