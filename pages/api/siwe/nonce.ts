import type { NextApiRequest, NextApiResponse } from 'next'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/iron-session/config'
import { generateNonce } from 'siwe'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).end()
  }
  const session = await getIronSession<SessionData>(req, res, sessionOptions)
  // store nonce in session to bind request → signature
  session.nonce = generateNonce()
  await session.save()
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json({ nonce: session.nonce })
}