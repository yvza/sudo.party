import "server-only";
import crypto from "crypto";

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is missing`);
  return v;
}

let KEY: Buffer | null = null;
export function getEncryptionKey(): Buffer {
  if (KEY) return KEY;
  const secret = requiredEnv("JSON_ENCRYPTION");
  KEY = crypto.createHash("sha256").update(secret, "utf8").digest();
  return KEY;
}

export function encryptServer(payload: string): string {
  const key = getEncryptionKey();                  // 32 bytes
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const ct = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
  return `${iv.toString("base64")}.${ct.toString("base64")}`;
}

export function decryptServer(token: string): string {
  const [ivB64, ctB64] = token.split(".");
  const key = getEncryptionKey();
  const iv = Buffer.from(ivB64, "base64");
  const ct = Buffer.from(ctB64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
}
