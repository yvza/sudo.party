import { NextResponse } from 'next/server'
import { turso } from '@/lib/turso'

export async function POST(req: Request) {
  const { address } = (await req.json()) as { address?: string }
  const addr = address?.toLowerCase()
  if (!addr || !/^0x[a-f0-9]{40}$/.test(addr)) {
    return NextResponse.json({ error: 'invalid address' }, { status: 400 })
  }

  // create wallet if missing
  await turso.execute({
    sql: `INSERT INTO wallets(address) VALUES(?) ON CONFLICT(address) DO NOTHING`,
    args: [addr],
  })

  // ensure it has default membership
  await turso.execute({
    sql: `
      UPDATE wallets SET membership_type_id = COALESCE(
        membership_type_id,
        (SELECT id FROM membership_types WHERE is_default=1 LIMIT 1)
      )
      WHERE address = ?
    `,
    args: [addr],
  })

  return NextResponse.json({ address: addr })
}