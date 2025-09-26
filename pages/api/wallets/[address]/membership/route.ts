// @ts-ignore
import { NextResponse } from 'next/server'
import { turso } from '@/lib/turso'

export async function POST(req: Request, { params }: { params: { address: string } }) {
  const { slug } = (await req.json()) as { slug?: string }
  const addr = params.address.toLowerCase()
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

  const [w, mt] = await Promise.all([
    turso.execute({ sql: `SELECT id FROM wallets WHERE address=?`, args: [addr] }),
    turso.execute({ sql: `SELECT id FROM membership_types WHERE slug=?`, args: [slug] }),
  ])
  if (!w.rows[0]) return NextResponse.json({ error: 'wallet not found' }, { status: 404 })
  if (!mt.rows[0]) return NextResponse.json({ error: 'membership not found' }, { status: 404 })

  await turso.execute({
    sql: `UPDATE wallets SET membership_type_id = ? WHERE id = ?`,
    args: [mt.rows[0].id, w.rows[0].id],
  })
  return NextResponse.json({ ok: true })
}