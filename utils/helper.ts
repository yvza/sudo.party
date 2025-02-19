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

export function removeDraft(post: articleProps[]) {
  return post.filter(post => !post.draft)
}

export function displayDateTime(date: any) {
  return format(parseISO(date), 'd LLLL, yyyy')
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
const passphrase: string = ')W-k7Ko,=M-nwJ}j^oyq'; // Use a strong passphrase in production

function deriveKey(passphrase: string): Buffer {
  return crypto.createHash('sha256').update(passphrase).digest();
}

const cachedKey = deriveKey(passphrase)

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
      // console.error('Invalid subscription pass format');
      return null;
    }

  } catch (error) {
    // console.error('Error decrypting subscription pass:', error);
    return null;
  }
}

// Function to derive an IV from JSON data
function deriveIv(jsonString: string) {
  return crypto.createHash('md5').update(jsonString).digest();
}

// New Methods for JSON Encryption and Decryption
export function encryptJson(json: string) {
  const jsonString = JSON.stringify(json);

  // Use an initialization vector (IV) for security
  const iv = deriveIv(jsonString);

  // Encrypt the JSON string
  const cipher = crypto.createCipheriv('aes-256-cbc', cachedKey, iv);
  const encryptedBuffer = Buffer.allocUnsafe(jsonString.length + 16)
  const encrypted = Buffer.concat([
    cipher.update(jsonString, 'utf-8'),
    cipher.final()
  ])

  return `${iv.toString('base64')}:${encrypted.toString('base64')}`
}

export function decryptJson(encryptedJson: string) {
  if (!encryptedJson) return null

  try {
    // Split IV and encrypted data
    const [ivBase64, encryptedData] = encryptedJson.split(':');

    // Decode IV from base64
    const iv = Buffer.from(ivBase64, 'base64');

    // Decrypt the data
    const decipher = crypto.createDecipheriv('aes-256-cbc', cachedKey, iv);
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedData, 'base64')),
      decipher.final()
    ])

    // Parse the JSON string
    return JSON.parse(decrypted.toString('utf-8'));

  } catch (error) {
    // console.error('Error decrypting JSON:', error);
    return null;
  }
}

export interface articleProps {
  content: string,
  title: string,
  date: string,
  draft: boolean,
  visibility: string,
  membership?: string | null,
  description?: string | null,
  _meta: {
    filePath: string,
    fileName: string,
    directory: string,
    extension: string,
    path: string
  },
  mdx: string,
  label: string
}

export function searchBySlug(data: articleProps[], searchSlug: string) {
  if (!data) return undefined
  return data.find(item => item._meta.path === searchSlug)
}

export function sortingPostDesc(data: articleProps[]) {
  return data.sort((a, b) => compareDesc(new Date(a.date), new Date(b.date)))
}

export function getLight() {
  if (typeof window == 'undefined') return

  return localStorage.getItem('theme') ?? 'light'
}

export function localFormatPrice(price: number, currency: boolean): string {
  const idr = new Intl.NumberFormat('en-ID')
  if (!currency) return idr.format(price)
  return `Rp. ${idr.format(price)}`
}

function base64UrlEncode(buffer: Buffer) {
  return buffer.toString('base64')
    .replace(/\+/g, '-') // Replace + with -
    .replace(/\//g, '_') // Replace / with _
    .replace(/=+$/, ''); // Remove trailing =
}

function base64UrlDecode(base64Url: string) {
  base64Url = base64Url
    .replace(/-/g, '+') // Replace - with +
    .replace(/_/g, '/'); // Replace _ with /

  // Pad with '='
  while (base64Url.length % 4) {
    base64Url += '=';
  }

  return Buffer.from(base64Url, 'base64');
}

export function encryptProductId(productId: string) {
  const IV = Buffer.alloc(16, 0); // 16-byte zero-filled buffer
  const key = crypto.createHash('sha256').update(passphrase).digest();
  // Encrypt the product ID
  const cipher = crypto.createCipheriv('aes-256-cbc', key, IV);
  const encryptedData = Buffer.concat([cipher.update(productId, 'utf-8'), cipher.final()]);

  return base64UrlEncode(encryptedData);
}

export function decryptProductId(encryptedProductId: string): number {
  const IV = Buffer.alloc(16, 0); // 16-byte zero-filled buffer
  const key = crypto.createHash('sha256').update(passphrase).digest();
  // Decrypt the product ID
  const encryptedBuffer = base64UrlDecode(encryptedProductId);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, IV);
  const decryptedData = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]).toString('utf-8');

  return Number(decryptedData);
}

export const fetcher = (url: string) => fetch(url).then((res) => res.json())