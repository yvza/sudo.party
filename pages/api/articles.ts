import { NextApiRequest, NextApiResponse } from "next"
import { allPosts } from 'content-collections'
import { encryptJson, removeDraft, sortingPostDesc } from "@/utils/helper"

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  if (request.method !== 'GET') return response.status(500).end()

  return response.status(200).json({
    data: Buffer.from(encryptJson(JSON.stringify(sortingPostDesc(removeDraft(allPosts)))))
  })
}