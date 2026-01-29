# Sudomain Web Application Documentation

> Comprehensive technical documentation covering architecture, security, API endpoints, and system flows.

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Architecture](#architecture)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Authentication System (SIWE)](#authentication-system-siwe)
8. [Payment System](#payment-system)
9. [Membership & Authorization](#membership--authorization)
10. [Security Implementation](#security-implementation)
11. [Internationalization (i18n)](#internationalization-i18n)
12. [Environment Variables](#environment-variables)
13. [Flow Diagrams](#flow-diagrams)

---

## Overview

Sudomain is a Next.js-based web application featuring:

- **Blog/Article Platform** with membership-gated content
- **Web3 Authentication** using Sign-In With Ethereum (SIWE)
- **Payment Processing** via Paymento (USDC payments)
- **Tiered Membership System** (Public, Supporter, SudoPartyPass)
- **Commenting System** with membership-based access control
- **Internationalization** supporting Indonesian, English, and Chinese

---

## Technology Stack

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.4.8 | React framework with App Router |
| React | 19.1.1 | UI library |
| TypeScript | 5.4.5 | Type safety |
| Tailwind CSS | 4.0.7 | Styling |

### Database & Storage
| Technology | Purpose |
|------------|---------|
| Turso (LibSQL) | SQLite-compatible serverless database |
| Vercel KV | Redis-compatible store for nonce management |

### Authentication & Security
| Technology | Purpose |
|------------|---------|
| SIWE | Sign-In With Ethereum authentication |
| iron-session | Encrypted cookie-based sessions |
| Wagmi | Ethereum wallet integration |
| Viem | Ethereum library for signatures |

### Payments
| Technology | Purpose |
|------------|---------|
| Paymento | USDC payment gateway |
| HMAC-SHA256 | Webhook signature verification |

### UI Components
| Technology | Purpose |
|------------|---------|
| Radix UI | Accessible component primitives |
| shadcn/ui | Pre-built component library |
| Lucide React | Icon library |

### State Management
| Technology | Purpose |
|------------|---------|
| React Query | Server state management |
| Redux Toolkit | Client state management |

### Internationalization
| Technology | Purpose |
|------------|---------|
| next-intl | i18n routing and translations |

---

## Project Structure

```
sudomain/
├── app/                          # Next.js App Router
│   ├── [locale]/                 # Locale-based routing
│   │   ├── blog/                 # Blog pages
│   │   │   ├── [slug]/           # Individual article pages
│   │   │   └── support/          # Support/donation page
│   │   ├── layout.tsx            # Locale layout
│   │   └── page.tsx              # Home page
│   ├── layout.tsx                # Root layout
│   ├── providers.tsx             # Client-side providers
│   └── globals.css               # Global styles
│
├── pages/api/                    # API Routes (Pages Router)
│   ├── auth.ts                   # Session management
│   ├── me.ts                     # Current user info
│   ├── product.ts                # Product listing
│   ├── siwe/                     # SIWE authentication
│   │   ├── nonce.ts              # Nonce generation
│   │   └── verify.ts             # Signature verification
│   ├── articles/                 # Article endpoints
│   │   ├── index.ts              # Article listing
│   │   └── [slug].ts             # Single article
│   ├── comments/                 # Comment endpoints
│   │   └── [slug].ts             # Comments by article
│   ├── paymento/                 # Payment endpoints
│   │   ├── ipn.ts                # Webhook handler
│   │   └── verify.ts             # Payment verification
│   ├── support/                  # Support endpoints
│   │   └── create-payment.ts     # Payment initiation
│   └── wallets/                  # Wallet endpoints
│       └── [address]/
│           └── route.ts          # Wallet info
│
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   ├── blog/                     # Blog-specific components
│   │   ├── siwe/                 # Wallet connection UI
│   │   ├── PostCard.tsx          # Article card
│   │   └── Pagination.tsx        # Pagination
│   └── providers/                # Context providers
│
├── lib/                          # Core libraries
│   ├── auth/                     # Auth utilities
│   ├── security/                 # Security utilities
│   │   └── payment-security.ts   # Payment validation
│   ├── iron-session/             # Session configuration
│   │   └── config.ts             # Session options
│   ├── siwe/                     # SIWE utilities
│   │   └── domain.ts             # Domain extraction
│   └── turso.ts                  # Database client
│
├── utils/                        # Helper utilities
│   ├── session.ts                # Session helpers
│   └── walletConnectConfig.ts    # WalletConnect setup
│
├── migrations/                   # Database migrations
├── posts/                        # Blog content (MDX/Markdown)
├── messages/                     # i18n translation files
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript definitions
├── middleware.ts                 # Next.js middleware
├── next.config.js                # Next.js configuration
└── config.ts                     # App configuration
```

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  Next.js App Router (app/)     │  React Components              │
│  - Locale-based routing        │  - shadcn/ui components        │
│  - Server Components           │  - Wallet connection UI        │
│  - Client Components           │  - Blog/Article views          │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                          API LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  Next.js API Routes (pages/api/)                                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │    Auth      │ │   Articles   │ │   Payments   │            │
│  │  /api/siwe/* │ │ /api/articles│ │ /api/paymento│            │
│  │  /api/auth   │ │ /api/comments│ │ /api/support │            │
│  │  /api/me     │ │              │ │              │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SERVICE LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ iron-session │ │    SIWE      │ │   Paymento   │            │
│  │  (Sessions)  │ │   (Auth)     │ │  (Payments)  │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│  ┌──────────────┐ ┌──────────────┐                              │
│  │  Vercel KV   │ │   Security   │                              │
│  │  (Nonces)    │ │  (Validation)│                              │
│  └──────────────┘ └──────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  Turso Database (SQLite)                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ wallets  │ │ comments │ │ payments │ │audit_log │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                        │
│  │membership│ │ article_ │ │supporter_│                        │
│  │ _types   │ │purchases │ │ grants   │                        │
│  └──────────┘ └──────────┘ └──────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

### Routing Strategy

The application uses a **hybrid routing approach**:

- **App Router** (`app/`): Used for pages and layouts with internationalization
- **Pages Router** (`pages/api/`): Used for API endpoints

This hybrid approach allows:
- Server Components for optimal performance
- Locale-based routing via `[locale]` dynamic segment
- Stable API routes with full request/response control

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│ membership_types│       │     wallets     │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │◄──────│ id (PK)         │
│ slug            │       │ address (UNIQUE)│
│ name            │       │ membership_type │
│ rank            │       │   _id (FK)      │
│ is_default      │       │ membership_     │
└─────────────────┘       │   expires_at    │
                          │ session_epoch   │
                          │ created_at      │
                          └────────┬────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
          ▼                        ▼                        ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│    comments     │      │article_purchases│      │ supporter_grants│
├─────────────────┤      ├─────────────────┤      ├─────────────────┤
│ id (PK)         │      │ id (PK)         │      │ id (PK)         │
│ post_slug       │      │ wallet_id (FK)  │      │ wallet_id (FK)  │
│ wallet_id (FK)  │      │ article_slug    │      │ payment_token   │
│ content         │      │ payment_token   │      │ starts_at       │
│ parent_id       │      │ price_usd       │      │ expires_at      │
│ is_deleted      │      │ purchased_at    │      │ source          │
│ is_approved     │      └─────────────────┘      └─────────────────┘
│ created_at      │
└─────────────────┘
```

### Table Definitions

#### `wallets`
Primary user identity table linked to Ethereum addresses.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `address` | TEXT | Ethereum address (0x...), unique |
| `membership_type_id` | INTEGER | FK to membership_types |
| `membership_expires_at` | INTEGER | Unix timestamp for expiry |
| `session_epoch` | INTEGER | Incremented on logout for revocation |
| `created_at` | TIMESTAMP | Record creation time |

#### `membership_types`
Defines available membership tiers.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `slug` | TEXT | Identifier: 'public', 'supporter', 'sudopartypass' |
| `name` | TEXT | Display name |
| `rank` | INTEGER | Access level (1=public, 2=supporter, 3=sudopartypass) |
| `is_default` | BOOLEAN | Default membership for new wallets |

#### `comments`
User comments on articles.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `post_slug` | TEXT | Article identifier |
| `wallet_id` | INTEGER | FK to wallets |
| `content` | TEXT | Comment text (max 500 graphemes) |
| `parent_id` | INTEGER | Parent comment for threading |
| `is_deleted` | BOOLEAN | Soft delete flag |
| `is_approved` | BOOLEAN | Moderation status |
| `created_at` | TIMESTAMP | Comment creation time |

#### `payments`
Payment transaction records from Paymento.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `token` | TEXT | Paymento payment token (unique) |
| `order_id` | TEXT | UUID from payment gateway |
| `payment_id` | INTEGER | Paymento internal ID |
| `status_code` | INTEGER | 7=PAID, 8=APPROVED |
| `status_text` | TEXT | Human-readable status |
| `raw_payload` | JSON | Full webhook payload |
| `updated_at` | TIMESTAMP | Last update time |

#### `article_purchases`
Individual article purchase records.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `wallet_id` | INTEGER | FK to wallets |
| `article_slug` | TEXT | Purchased article |
| `payment_token` | TEXT | FK to payments |
| `price_usd` | REAL | Purchase price |
| `purchased_at` | TIMESTAMP | Purchase time |

**Constraint:** UNIQUE(wallet_id, article_slug)

#### `supporter_grants`
Membership grants from donations.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `wallet_id` | INTEGER | FK to wallets |
| `payment_token` | TEXT | Associated payment |
| `starts_at` | TIMESTAMP | Grant start time |
| `expires_at` | TIMESTAMP | Grant expiry time |
| `source` | TEXT | Grant source ('paymento') |

**Constraint:** UNIQUE(wallet_id, payment_token)

#### `payment_outbox`
Pending payment tracking for idempotency.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `token` | TEXT | Payment token (unique) |
| `order_id` | TEXT | Order UUID |
| `wallet_id` | INTEGER | FK to wallets |
| `article_slug` | TEXT | Target article (nullable) |
| `expected_price` | REAL | Expected payment amount |
| `payment_hash` | TEXT | HMAC hash for verification |
| `hash_timestamp` | INTEGER | Hash creation timestamp |
| `created_at` | TIMESTAMP | Record creation time |

#### `audit_log`
Security and payment audit trail.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `event_type` | TEXT | Event category |
| `timestamp` | INTEGER | Unix timestamp |
| `ip` | TEXT | Client IP address |
| `wallet_address` | TEXT | Associated wallet |
| `wallet_id` | INTEGER | FK to wallets |
| `article_slug` | TEXT | Related article |
| `amount` | REAL | Transaction amount |
| `token` | TEXT | Payment token (truncated) |
| `reason` | TEXT | Event reason/details |
| `metadata` | JSON | Additional data |
| `created_at` | TIMESTAMP | Record creation time |

**Event Types:**
- `payment_initiated` - Payment creation started
- `payment_verified` - Payment successfully verified
- `payment_failed` - Payment verification failed
- `purchase_granted` - Article access granted
- `rate_limit_exceeded` - Rate limit triggered
- `validation_failed` - Input validation failure
- `hmac_verification_failed` - Webhook signature mismatch
- `suspicious_activity` - Potential security issue

---

## API Endpoints

### Authentication Endpoints

#### `POST /api/siwe/nonce`
Generate a cryptographic nonce for SIWE authentication.

| Property | Value |
|----------|-------|
| Auth Required | No |
| Rate Limited | No |
| CSRF Protected | No |

**Response:**
```json
{
  "nonce": "abc123xyz..."
}
```

**Security:**
- Nonce bound to session
- 10-minute TTL in Vercel KV
- Single-use (consumed on verify)

---

#### `POST /api/siwe/verify`
Verify SIWE signature and establish authenticated session.

| Property | Value |
|----------|-------|
| Auth Required | No |
| Rate Limited | No |
| CSRF Protected | Yes (same-origin) |

**Request Body:**
```json
{
  "message": "sudomain.xyz wants you to sign in...",
  "signature": "0x...",
  "rememberMe": true
}
```

**Response:**
```json
{
  "ok": true,
  "address": "0x1234...abcd"
}
```

**Validations:**
- Nonce matches session-bound nonce
- Nonce not previously used (KV check)
- Message timestamp within 5 minutes
- Domain matches expected domain
- Chain ID in allowlist
- Signature cryptographically valid

---

#### `GET /api/auth`
Get current session status.

| Property | Value |
|----------|-------|
| Auth Required | No |
| Rate Limited | No |

**Response (authenticated):**
```json
{
  "address": "0x1234...abcd",
  "membership": "supporter",
  "rank": 2
}
```

**Response (unauthenticated):**
```json
{
  "address": null
}
```

---

#### `POST /api/auth`
Refresh session and sync membership from database.

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| CSRF Protected | Yes |

---

#### `DELETE /api/auth`
Logout and destroy session.

| Property | Value |
|----------|-------|
| Auth Required | Yes |

**Actions:**
- Destroys session cookie
- Increments `session_epoch` in database (invalidates other sessions)

---

#### `GET /api/me`
Get authenticated user info with membership details.

| Property | Value |
|----------|-------|
| Auth Required | Yes |

**Response:**
```json
{
  "address": "0x1234...abcd",
  "membership": "supporter",
  "rank": 2,
  "expiresAt": 1735689600
}
```

---

### Article Endpoints

#### `GET /api/articles`
List articles with pagination and membership filtering.

| Property | Value |
|----------|-------|
| Auth Required | No |
| Caching | 600s (public), no-store (restricted) |

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 10) |
| `membership` | string | Filter by membership tier |

**Response:**
```json
{
  "articles": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50
  }
}
```

---

#### `GET /api/articles/[slug]`
Get single article with membership-gated content.

| Property | Value |
|----------|-------|
| Auth Required | Conditional |

**Authorization Flow:**
1. Check if article is draft → require auth
2. Check article membership requirement
3. Compare user rank vs required rank
4. Check individual article purchase
5. Return content or 403

**Response (authorized):**
```json
{
  "slug": "my-article",
  "title": "Article Title",
  "content": "...",
  "membership": "public"
}
```

**Response (unauthorized):**
```json
{
  "error": "INSUFFICIENT_MEMBERSHIP",
  "requiredRank": 2,
  "articlePrice": 5.00
}
```

---

### Comment Endpoints

#### `GET /api/comments/[slug]`
Get comments for an article.

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| Session Validation | Active session required |

**Response:**
```json
{
  "comments": [
    {
      "id": 1,
      "content": "Great article!",
      "walletAddress": "0x1234...abcd",
      "isCreator": false,
      "supporterBadgeCount": 2,
      "parentId": null,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

#### `POST /api/comments/[slug]`
Post a comment on an article.

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| CSRF Protected | Yes |
| Membership Required | Based on article |

**Request Body:**
```json
{
  "content": "This is my comment",
  "parentId": null
}
```

**Validations:**
- Max 500 graphemes (Unicode-aware)
- Parent comment must exist if specified
- User rank >= article required rank

---

### Payment Endpoints

#### `POST /api/support/create-payment`
Initiate a payment for article purchase or donation.

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| CSRF Protected | Yes |
| Rate Limited | 5 req/min per IP |

**Request Body:**
```json
{
  "walletAddress": "0x1234...abcd",
  "kind": "article-purchase",
  "articleSlug": "premium-article",
  "fiatAmount": 5.00
}
```

**Kind Values:**
- `article-purchase` - Buy individual article
- `support-donation` - Become a supporter

**Response:**
```json
{
  "token": "pay_abc123",
  "redirectUrl": "https://paymento.io/pay/..."
}
```

**Validations:**
- Wallet address matches session
- Article exists and is purchasable
- Price matches server-side price
- Fiat amount: $0.01 - $10,000

---

#### `POST /api/paymento/ipn`
Webhook handler for payment notifications from Paymento.

| Property | Value |
|----------|-------|
| Auth Required | No (webhook) |
| HMAC Verified | Yes |
| Idempotent | Yes |

**Security Layers:**
1. HMAC-SHA256 signature verification
2. Payment status verification via Paymento API
3. Price matching against payment_outbox
4. Idempotency via unique constraints

**Webhook Payload:**
```json
{
  "token": "pay_abc123",
  "orderId": "uuid-...",
  "paymentId": 12345,
  "statusCode": 7,
  "statusText": "PAID"
}
```

**Actions on Success:**
- For `article-purchase`: Create `article_purchases` record
- For `support-donation`: Upgrade membership, create `supporter_grants`

---

#### `POST /api/paymento/verify`
Client-side payment status verification.

| Property | Value |
|----------|-------|
| Auth Required | No |
| Rate Limited | 5 req/min per IP |

**Request Body:**
```json
{
  "token": "pay_abc123"
}
```

**Response:**
```json
{
  "status": "PAID",
  "verified": true
}
```

---

## Authentication System (SIWE)

### Overview

Sign-In With Ethereum (SIWE) provides passwordless authentication using Ethereum wallet signatures. Users prove ownership of their wallet address by signing a message.

### Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │     │   API    │     │ Vercel KV│     │  Turso   │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │ 1. Request nonce               │                │
     │───────────────>│                │                │
     │                │                │                │
     │                │ 2. Generate nonce              │
     │                │───────────────>│                │
     │                │                │                │
     │ 3. Return nonce│                │                │
     │<───────────────│                │                │
     │                │                │                │
     │ 4. User signs message          │                │
     │ (in wallet)    │                │                │
     │                │                │                │
     │ 5. Submit signature            │                │
     │───────────────>│                │                │
     │                │                │                │
     │                │ 6. Check nonce not used        │
     │                │───────────────>│                │
     │                │                │                │
     │                │ 7. Verify signature            │
     │                │ (cryptographic)│                │
     │                │                │                │
     │                │ 8. Create/get wallet           │
     │                │───────────────────────────────>│
     │                │                │                │
     │                │ 9. Create session              │
     │                │ (iron-session) │                │
     │                │                │                │
     │ 10. Set cookie │                │                │
     │<───────────────│                │                │
     │                │                │                │
```

### Session Configuration

Sessions are managed using `iron-session` with encrypted cookies.

**Default Session (Remember Me = false):**
| Setting | Value |
|---------|-------|
| Cookie Max Age | 7 days |
| Idle Timeout | 30 minutes |
| Absolute Timeout | 24 hours |

**Extended Session (Remember Me = true):**
| Setting | Value |
|---------|-------|
| Cookie Max Age | 30 days |
| Idle Timeout | 12 hours |
| Absolute Timeout | 7 days |

### Session Data Structure

```typescript
interface SessionData {
  nonce?: string;           // SIWE nonce (pre-auth)
  siwe?: SiweMessage;       // Verified SIWE message
  address?: string;         // Wallet address
  membership?: string;      // Membership slug
  rank?: number;            // Membership rank
  sessionEpoch?: number;    // For server-side revocation
  lastActivity?: number;    // Idle timeout tracking
  createdAt?: number;       // Absolute timeout tracking
  rememberMe?: boolean;     // Extended session flag
}
```

### Security Features

1. **Nonce Binding**: Nonce stored in session, verified on sign-in
2. **Nonce Single-Use**: Stored in Vercel KV with 10-min TTL
3. **Message Freshness**: Timestamp must be within 5 minutes
4. **Domain Validation**: Message domain must match server domain
5. **Chain ID Allowlist**: Only approved chains accepted
6. **Session Epoch**: Incremented on logout to invalidate other sessions

---

## Payment System

### Overview

Payments are processed through Paymento, a USDC payment gateway. The system supports:
- Individual article purchases
- Support donations (grants membership)

### Payment Flow Diagram

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │     │   API    │     │ Paymento │     │  Turso   │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │ 1. Create payment              │                │
     │───────────────>│                │                │
     │                │                │                │
     │                │ 2. Validate request            │
     │                │ (session, price, article)      │
     │                │                │                │
     │                │ 3. Create outbox record        │
     │                │───────────────────────────────>│
     │                │                │                │
     │                │ 4. Create payment              │
     │                │───────────────>│                │
     │                │                │                │
     │ 5. Redirect URL│                │                │
     │<───────────────│                │                │
     │                │                │                │
     │ 6. User pays on Paymento       │                │
     │───────────────────────────────>│                │
     │                │                │                │
     │                │ 7. IPN webhook │                │
     │                │<───────────────│                │
     │                │                │                │
     │                │ 8. Verify HMAC │                │
     │                │                │                │
     │                │ 9. Verify payment              │
     │                │───────────────>│                │
     │                │                │                │
     │                │ 10. Grant access               │
     │                │───────────────────────────────>│
     │                │                │                │
```

### Payment Types

#### Article Purchase
- User buys access to a specific article
- Creates `article_purchases` record
- Access is permanent (no expiry)

#### Support Donation
- User donates to become a supporter
- Upgrades membership from Public to Supporter
- Creates `supporter_grants` record
- Membership expires after configured months

### Payment Security

| Layer | Implementation |
|-------|----------------|
| HMAC Verification | SHA-256 signature on webhook |
| Price Validation | Server-side price source |
| Idempotency | Unique constraints |
| Rate Limiting | 5 req/min per IP |
| Input Validation | Regex patterns |
| Audit Logging | All events logged |

---

## Membership & Authorization

### Membership Tiers

| Tier | Slug | Rank | Description |
|------|------|------|-------------|
| Public | `public` | 1 | Default, free access |
| Supporter | `supporter` | 2 | Paid tier, temporary |
| SudoPartyPass | `sudopartypass` | 3 | Premium tier |

### Authorization Model

Access is determined by comparing user rank to content requirement:

```
User Rank >= Required Rank → Access Granted
User Rank <  Required Rank → Access Denied (or purchase option)
```

### Content Gating

Articles specify required membership in frontmatter:

```yaml
---
title: "Premium Article"
membership: supporter  # Requires rank 2+
price: 5.00           # Individual purchase price
---
```

### Authorization Bypass

Individual article purchases bypass membership requirements:
- User can buy specific articles without subscription
- Purchase grants permanent access to that article
- Stored in `article_purchases` table

---

## Security Implementation

### Overview

The application implements defense-in-depth security across multiple layers.

### Session Security

| Feature | Implementation |
|---------|----------------|
| Encryption | AES-256 via iron-session |
| Cookie Flags | HttpOnly, Secure, SameSite=Lax |
| Idle Timeout | 30 min (default) / 12 hr (remember) |
| Absolute Timeout | 24 hr (default) / 7 days (remember) |
| Server Revocation | Session epoch mechanism |

### CSRF Protection

Implemented via same-origin validation:

```typescript
function assertSameOrigin(req: NextApiRequest) {
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  // Validates Origin or Referer matches expected domain
}
```

**Protected Endpoints:**
- `POST /api/auth`
- `POST /api/siwe/verify`
- `POST /api/support/create-payment`
- `POST /api/comments/[slug]`

### Input Validation

| Input | Pattern | Description |
|-------|---------|-------------|
| Wallet Address | `^0x[a-f0-9]{40}$` | Ethereum address |
| Article Slug | `^[a-z0-9][a-z0-9_-]{0,99}$` | URL-safe identifier |
| Fiat Amount | `0.01 - 10000` | USD range |
| Comment | Max 500 graphemes | Unicode-aware |

### Content Security Policy

Configured in `next.config.js`:

```
default-src 'self'
script-src  'self' 'unsafe-inline' 'unsafe-eval' (dev only)
style-src   'self' 'unsafe-inline'
connect-src 'self' paymento.io alchemy.com walletconnect.com
frame-src   'self' verify.walletconnect.com
img-src     'self' data: blob:
```

### HTTP Security Headers

| Header | Value |
|--------|-------|
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| Referrer-Policy | strict-origin-when-cross-origin |
| Strict-Transport-Security | max-age=63072000 |
| Permissions-Policy | camera=(), microphone=(), geolocation=() |

---

## Internationalization (i18n)

### Supported Locales

| Locale | Language | Default |
|--------|----------|---------|
| `id` | Indonesian | Yes |
| `en` | English | No |
| `zh` | Chinese | No |

### Implementation

Uses `next-intl` with App Router:

```
app/
└── [locale]/
    ├── page.tsx
    ├── layout.tsx
    └── blog/
        └── [slug]/
            └── page.tsx
```

### Article Translations

Articles support locale-specific versions:

```
posts/
└── my-article/
    ├── article.md      # Default (Indonesian)
    ├── article.en.md   # English
    └── article.zh.md   # Chinese
```

### Translation Files

Located in `/messages`:

```
messages/
├── id.json
├── en.json
└── zh.json
```

---

## Environment Variables

### Required Variables

#### Database
```bash
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-auth-token
```

#### Session
```bash
IRON_SESSION_PASSWORD=minimum-32-character-secret-key
```

#### Payment
```bash
PAYMENTO_API_KEY=dev-api-key
PAYMENTO_API_KEY_PROD=prod-api-key
PAYMENTO_HMAC_SECRET=dev-hmac-secret
PAYMENTO_HMAC_SECRET_PROD=prod-hmac-secret
PAYMENT_HASH_SECRET=minimum-32-character-secret
```

#### WalletConnect
```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id
```

### Optional Variables

#### SIWE Configuration
```bash
SIWE_ALLOWED_CHAINS=1,11155111  # Mainnet + Sepolia
SIWE_DOMAIN=sudomain.xyz        # Lock to specific domain
```

#### Application
```bash
CREATOR_ADDRESS=0x...           # Creator wallet for badges
NEXT_PUBLIC_BASE_URL=https://sudomain.xyz
NEXT_PUBLIC_NODE_ENV=production
SUPPORTER_MONTHS=12             # Membership duration
SUPPORT_MIN_USD=5               # Minimum donation
```

---

## Flow Diagrams

### User Registration Flow

```
User connects wallet
        │
        ▼
Request nonce from /api/siwe/nonce
        │
        ▼
Sign message in wallet
        │
        ▼
Submit to /api/siwe/verify
        │
        ▼
Verify signature + create session
        │
        ▼
Create wallet record (if new)
        │
        ▼
User authenticated
```

### Article Access Flow

```
User requests article
        │
        ▼
Check if draft ──Yes──► Require auth
        │
        No
        ▼
Get article membership requirement
        │
        ▼
Get user rank (from session)
        │
        ▼
User rank >= required? ──Yes──► Return content
        │
        No
        ▼
Has individual purchase? ──Yes──► Return content
        │
        No
        ▼
Return 403 + purchase option
```

### Comment Posting Flow

```
User submits comment
        │
        ▼
Validate session active
        │
        ▼
Check CSRF (same-origin)
        │
        ▼
Validate content length (≤500 graphemes)
        │
        ▼
Check user rank >= article requirement
        │
        ▼
Validate parent comment (if reply)
        │
        ▼
Insert comment record
        │
        ▼
Return success
```

---

## Security Checklist

### Production Deployment

- [ ] Set `IRON_SESSION_PASSWORD` (32+ chars)
- [ ] Set `PAYMENT_HASH_SECRET` (32+ chars)
- [ ] Configure `PAYMENTO_API_KEY_PROD`
- [ ] Configure `PAYMENTO_HMAC_SECRET_PROD`
- [ ] Set `SIWE_DOMAIN` to production domain
- [ ] Remove Sepolia from `SIWE_ALLOWED_CHAINS`
- [ ] Verify CSP headers in production
- [ ] Enable HTTPS only

---

## File Reference

| File | Purpose |
|------|---------|
| `lib/turso.ts` | Database client |
| `lib/iron-session/config.ts` | Session configuration |
| `lib/security/payment-security.ts` | Payment validation |
| `lib/siwe/domain.ts` | Domain extraction |
| `utils/session.ts` | Session helpers |
| `middleware.ts` | Request middleware |
| `next.config.js` | App configuration |

---

*Documentation generated for Sudomain Web Application*
*Last updated: January 2026*
