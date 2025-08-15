import type { NextApiRequest, NextApiResponse } from 'next'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/iron-session/config'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end() }
  const session = await getIronSession<SessionData>(req, res, sessionOptions)
  await session.destroy()
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json({ ok: true })
}