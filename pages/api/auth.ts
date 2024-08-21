import { NextApiRequest, NextApiResponse } from "next"
import { getIronSession } from "iron-session"
import {
  defaultSession,
  sessionOptions,
  SessionData,
} from "@/lib/iron-session/config"
import { db } from "@/config"

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const session = await getIronSession<SessionData>(
    request,
    response,
    sessionOptions,
  )

  if (request.method === "POST") {
    const { key } = request.body

    try {
      const params = {
        TableName: 'sudopartypass',
        Key: {
          pk: key,
          sk: key
        }
      }
      const query = await db.get(params)

      if (!query.Item) {
        return response.status(200).json('Not found')
      }

      session.pk = query.Item.pk,
      session.identifier = query.Item.identifier,
      session.type = query.Item.type,
      session.isLoggedIn = true
      await session.save()

      return response.status(200).json(query)
    } catch (error: any) {
      return response.status(500).json(error.message)
    }
  } else if (request.method === "GET") {
    if (session.isLoggedIn !== true) {
      return response.json(defaultSession)
    }

    return response.json(session)
  } else if (request.method === "DELETE") {
    session.destroy()

    return response.json(defaultSession)
  }

  return response.status(500).end()
}