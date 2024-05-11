import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { compareDesc, format, parseISO } from 'date-fns'
import crypto from 'crypto';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shouldILogin(visibility: string) {
  switch (visibility) {
    case 'private':
      return true

    case 'public':
      return false
  }
}

export interface postPhase2 {
  slug: string,
  entry: {
    title: string,
    date: string,
    draft: boolean,
    visibility: string,
    membership?: string,
    description?: string
  }
}

export function removeDraftPhase2(post: postPhase2[]) {
  return post.filter(post => !post.entry.draft)
}

export function displayDateTime(date: any) {
  return format(parseISO(date), 'LLLL d, yyyy')
}

export function randomizeCharacter() {
  // Generate a random number between 0 and 25 (inclusive)
  var randomNumber = Math.floor(Math.random() * 26);

  // Convert the random number to a character code starting from 'a'
  var randomCharCode = 'a'.charCodeAt(0) + randomNumber;

  // Convert the character code back to a character
  var randomCharacter = String.fromCharCode(randomCharCode);

  return randomCharacter;
}

const sp2: string = 'SP2';
const passphrase: string = 'YourSecurePassphrase'; // Use a strong passphrase in production

function deriveKey(passphrase: string): Buffer {
  return crypto.createHash('sha256').update(passphrase).digest();
}

function generateRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export function generateSubscriptionPass(): string {
  const randomString: string = generateRandomString(13); // Adjust the length as needed
  const timestamp: number = Date.now();

  // Combine randomString and timestamp
  const dataToEncrypt: string = `${sp2}${randomString}${timestamp}`;

  // Derive the key from the passphrase
  const key: Buffer = deriveKey(passphrase);

  // Use an initialization vector (IV) for security
  const iv: Buffer = crypto.randomBytes(16);

  // Encrypt the combined data
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encryptedData: string = Buffer.concat([cipher.update(dataToEncrypt, 'utf-8'), cipher.final()]).toString('base64');

  return `${iv.toString('base64')}:${encryptedData}`;
}

export function decryptSubscriptionPass(encryptedPass: string): { randomString: string, timestamp: number } | null {
  // Derive the key from the passphrase
  const key: Buffer = deriveKey(passphrase);

  try {
    // Split IV and encrypted data
    const [ivBase64, encryptedData] = encryptedPass.split(':');

    // Decode IV from base64
    const iv: Buffer = Buffer.from(ivBase64, 'base64');

    // Decrypt the data
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    const decryptedData: string = Buffer.concat([decipher.update(Buffer.from(encryptedData, 'base64')), decipher.final()]).toString('utf-8');

    // Extract randomString and timestamp
    const matchResult = decryptedData.match(/^SP2(.+?)(\d+)$/);
    if (matchResult) {
      const [, randomString, timestamp] = matchResult;
      return { randomString, timestamp: parseInt(timestamp, 10) };
    } else {
      console.error('Invalid subscription pass format');
      return null;
    }

  } catch (error) {
    console.error('Error decrypting subscription pass:', error);
    return null;
  }
}