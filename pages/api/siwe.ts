import { NextApiRequest, NextApiResponse } from "next";
import { SiweMessage } from "siwe";
import { getIronSession } from "iron-session";
import { siweSession } from "@/types/global";
import { siweSessionConfig } from "@/utils/session";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getIronSession<siweSession>(req, res, siweSessionConfig);

  if (req.method === "POST") {
    try {
      const { message, signature } = req.body;
      const siweMessage = new SiweMessage(message);
      const fields = await siweMessage.verify({ signature });

      console.log('siweMessage.verify() ', fields)

      if (fields.success) {
        session.address = siweMessage.address;
        session.isAuthenticated = true;
        await session.save();
        return res.status(200).json({ success: true, address: siweMessage.address });
      }

      res.status(400).json({ success: false, message: "Invalid SIWE message" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  } else if (req.method === "GET") {
    if (session.isAuthenticated) {
      return res.status(200).json({ authenticated: true, address: session.address });
    }
    res.status(401).json({ authenticated: false });
  } else {
    res.status(405).end(); // Method Not Allowed
  }
}
