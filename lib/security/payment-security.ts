import { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { createClient } from "@libsql/client";
import { securityLogger } from "@/lib/logger";

// ============================================================================
// PAYMENT SECURITY MODULE
// Provides comprehensive security layers for payment processing
// ============================================================================

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per minute per IP
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Get client IP from request, handling proxies
 */
export function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded)) {
    return forwarded[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

/**
 * Rate limiter - prevents abuse of payment endpoints
 */
export function checkRateLimit(
  ip: string,
  endpoint: string
): { allowed: boolean; retryAfter?: number } {
  const key = `${ip}:${endpoint}`;
  const now = Date.now();

  // Clean up expired entries periodically
  if (Math.random() < 0.1) {
    const entries = Array.from(rateLimitStore.entries());
    for (const [k, v] of entries) {
      if (v.resetAt < now) rateLimitStore.delete(k);
    }
  }

  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    // New window
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true };
}

// ============================================================================
// HMAC SIGNATURE VERIFICATION (Paymento's recommended approach)
// ============================================================================

/**
 * Verify HMAC-SHA256 signature from Paymento webhook
 * Per Paymento docs: https://docs.paymento.io/api-documention/payment-callback
 *
 * Steps:
 * 1. Get raw payload (entire body of POST request)
 * 2. Use secret key from Paymento dashboard
 * 3. Calculate HMAC-SHA256 hash of payload using secret key
 * 4. Convert to uppercase hexadecimal
 * 5. Compare with X-HMAC-SHA256-SIGNATURE header
 */
export function verifyPaymentoHmac(
  rawBody: string | Buffer,
  signature: string | undefined
): { valid: boolean; reason?: string } {
  const secretKey = process.env.PAYMENTO_HMAC_SECRET;

  if (!secretKey) {
    // If no HMAC secret configured, log warning but allow (fallback to API verification)
    securityLogger.warn("PAYMENTO_HMAC_SECRET not configured - HMAC verification skipped");
    return { valid: true, reason: "hmac_not_configured" };
  }

  if (!signature) {
    return { valid: false, reason: "missing_signature" };
  }

  // Convert body to string if Buffer
  const payload = typeof rawBody === "string" ? rawBody : rawBody.toString("utf-8");

  // Calculate HMAC-SHA256
  const calculatedSignature = crypto
    .createHmac("sha256", secretKey)
    .update(payload)
    .digest("hex")
    .toUpperCase();

  // Normalize received signature (handle both uppercase and base64 formats)
  const normalizedReceived = signature.toUpperCase();

  // Use timing-safe comparison to prevent timing attacks
  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(calculatedSignature),
      Buffer.from(normalizedReceived)
    );
    return { valid: isValid, reason: isValid ? undefined : "signature_mismatch" };
  } catch {
    // Length mismatch - signatures don't match
    return { valid: false, reason: "signature_length_mismatch" };
  }
}

/**
 * Extract HMAC signature from request headers
 * Paymento uses: X-HMAC-SHA256-SIGNATURE or X-Hmac-Sha256-Signature
 */
export function getHmacSignature(req: NextApiRequest): string | undefined {
  // Try various header name formats (case-insensitive in HTTP, but Node lowercases them)
  return (
    (req.headers["x-hmac-sha256-signature"] as string) ||
    (req.headers["x-hmac_sha256_signature"] as string) ||
    (req.headers["hmac_sha256_signature"] as string) ||
    undefined
  );
}

// ============================================================================
// INPUT VALIDATION
// ============================================================================

/**
 * Generate a secure hash for payment verification
 */
export function generatePaymentHash(
  walletId: number,
  articleSlug: string,
  price: number,
  timestamp: number
): string {
  const secret = process.env.PAYMENT_HASH_SECRET || process.env.IRON_SESSION_PASSWORD!;
  const data = `${walletId}:${articleSlug}:${price}:${timestamp}`;
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

/**
 * Verify payment hash
 */
export function verifyPaymentHash(
  hash: string,
  walletId: number,
  articleSlug: string,
  price: number,
  timestamp: number,
  maxAgeMs: number = 30 * 60 * 1000 // 30 minutes default
): boolean {
  const now = Date.now();
  if (now - timestamp > maxAgeMs) return false; // Expired

  const expected = generatePaymentHash(walletId, articleSlug, price, timestamp);
  try {
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expected));
  } catch {
    return false;
  }
}

/**
 * Sanitize and validate article slug
 */
export function validateArticleSlug(slug: unknown): string | null {
  if (typeof slug !== "string") return null;

  // Only allow alphanumeric, hyphens, and underscores
  const sanitized = slug.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9_-]{0,99}$/.test(sanitized)) return null;

  return sanitized;
}

/**
 * Validate fiat amount is within acceptable bounds
 */
export function validateFiatAmount(
  amount: unknown,
  min: number = 0.01,
  max: number = 10000
): number | null {
  const num = Number(amount);
  if (isNaN(num) || !isFinite(num)) return null;
  if (num < min || num > max) return null;

  // Round to 2 decimal places to avoid floating point issues
  return Math.round(num * 100) / 100;
}

/**
 * Validate wallet address format (Ethereum-style)
 */
export function validateWalletAddress(address: unknown): string | null {
  if (typeof address !== "string") return null;

  const cleaned = address.trim().toLowerCase();
  if (!/^0x[a-f0-9]{40}$/.test(cleaned)) return null;

  return cleaned;
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

export type AuditEventType =
  | "payment_initiated"
  | "payment_verified"
  | "payment_failed"
  | "purchase_granted"
  | "rate_limit_exceeded"
  | "validation_failed"
  | "hmac_verification_failed"
  | "suspicious_activity";

export interface AuditLogEntry {
  eventType: AuditEventType;
  timestamp: number;
  ip: string;
  walletAddress?: string;
  walletId?: number;
  articleSlug?: string;
  amount?: number;
  token?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log security-relevant events to database
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const db = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    await db.execute({
      sql: `INSERT INTO audit_log (event_type, timestamp, ip, wallet_address, wallet_id, article_slug, amount, token, reason, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        entry.eventType,
        entry.timestamp,
        entry.ip || null,
        entry.walletAddress || null,
        entry.walletId || null,
        entry.articleSlug || null,
        entry.amount || null,
        entry.token ? entry.token.substring(0, 50) : null, // Truncate token for storage
        entry.reason || null,
        entry.metadata ? JSON.stringify(entry.metadata) : null,
      ],
    });
  } catch (error) {
    // Don't let audit logging failures break the main flow
    securityLogger.error("Failed to log audit event:", error);
  }
}

// ============================================================================
// MIDDLEWARE HELPERS
// ============================================================================

/**
 * Apply rate limiting and return error response if exceeded
 */
export function applyRateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  endpoint: string
): boolean {
  const ip = getClientIP(req);
  const { allowed, retryAfter } = checkRateLimit(ip, endpoint);

  if (!allowed) {
    // Log rate limit event
    logAuditEvent({
      eventType: "rate_limit_exceeded",
      timestamp: Date.now(),
      ip,
      reason: `Rate limit exceeded for ${endpoint}`,
    });

    res.setHeader("Retry-After", String(retryAfter));
    res.status(429).json({
      error: "Too many requests",
      retryAfter,
    });
    return false;
  }

  return true;
}

/**
 * Check if price matches expected (with small tolerance for float issues)
 */
export function pricesMatch(actual: number, expected: number, tolerance: number = 0.01): boolean {
  return Math.abs(actual - expected) <= tolerance;
}
