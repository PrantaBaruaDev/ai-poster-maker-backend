# AI Political Poster Maker — Backend API

Express + TypeScript API that generates print-ready Bangla political posters using Google Gemini for layout intelligence and Puppeteer for deterministic HTML/CSS rendering.

**Live concept:** A user fills a short form (name, designation, party, occasion, headline, up to 3 photos), picks a template, and receives a 1200×1600 print-ready PNG in seconds.

---

## Table of Contents

1.  [Tech Stack](#tech-stack)
2.  [Architecture](#architecture)
3.  [Folder Structure](#folder-structure)
4.  [Database Schema](#database-schema)
5.  [Environment Variables](#environment-variables)
6.  [Local Setup](#local-setup)
7.  [API Reference](#api-reference)
    *   [Auth](#auth-endpoints)
    *   [Templates](#template-endpoints)
    *   [Upload](#upload-endpoints)
    *   [Posters](#poster-endpoints)
    *   [Admin](#admin-endpoints)
8.  [Poster Generation Pipeline](#poster-generation-pipeline)
9.  [Gemini Integration](#gemini-integration)
10.  [Font System](#font-system)
11.  [Error Handling](#error-handling)
12.  [Rate Limiting](#rate-limiting)
13.  [Known Limitations](#known-limitations)
14.  [Future Roadmap](#future-roadmap)

---

## Tech Stack

| Layer | Technology | Why |
| --- | --- | --- |
| Runtime | Node.js 24+ (Bun) | Native TypeScript, fast installs |
| Language | TypeScript 5.9+ | Type safety across the codebase |
| Framework | Express 5 | Standard, minimal, well-documented |
| Database | PostgreSQL (Neon/Supabase/Railway) | Relational integrity, JSONB for flexible fields |
| ORM | Prisma 7.10 + `@prisma/adapter-pg` | Typed queries, migrations, driver adapter for v7 |
| AI | Google Gemini (`gemini-3.8-flash`) | Layout JSON only — never draws text |
| Renderer | Puppeteer 24 (headless Chromium) | Real browser engine = correct Bangla shaping |
| Fonts | Anek Bangla, Hind Siliguri, Noto Serif Bengali, Galada | SIL OFL, bundled locally |
| File Storage | Cloudinary | Free tier, CDN, transformations |
| Validation | Zod 4 | Type-safe runtime validation |
| Auth | JWT (httpOnly cookies) + bcrypt | Stateless, XSS-resistant |

---

## Architecture

### High-level

```
┌──────────────────────┐
│  Next.js Frontend    │  (Phase 7–8, separate project)
│  localhost:3000      │
└──────────┬───────────┘
           │  REST / JSON  (httpOnly cookies)
           ▼
┌──────────────────────────────────────────────┐
│  Express API   localhost:5000                │
│                                              │
│  routes → controllers → services → repos     │
│                          │                   │
│                          ├── GenerationService
│                          │     ├── GeminiClient (layout JSON)
│                          │     └── RenderService (Puppeteer → PNG)
│                          │                   │
│                          ├── Cloudinary      │
│                          └── Prisma → Postgres
└──────────────────────────────────────────────┘
```

### Layered Modular Monolith

Each feature lives in `src/app/modules/<feature>/` with strict layering:

```
route → controller → service → repository → Prisma
```

**Rules enforced:**

*   **Routes** wire HTTP + middleware only.
*   **Controllers** validate + shape responses. Never touch Prisma.
*   **Services** hold business logic. Never import Express types.
*   **Repositories** are the **only** place `prisma.*` appears.
*   **Cross-module calls** go service-to-service, never repository-to-repository.

### Critical design decision — Option B pipeline

**AI never draws text.** Gemini returns a structured JSON recipe (palette, photo crops, headline style). Puppeteer renders the actual poster with the user's exact Bangla spelling. This eliminates the #1 failure mode of AI-generated Bangla — broken conjuncts and misspellings.

If Gemini fails, times out, or returns invalid JSON, the template's default palette is used and the poster still renders. **AI is never on the critical path.**

---

## Folder Structure

```
backend/
├── prisma/
│   ├── schema.prisma                 # Single source of truth
│   ├── migrations/                   # Auto-generated
│   └── seeds/
│       └── index.ts                  # 3 seed templates
├── scripts/
│   ├── render-sample.ts              # Puppeteer smoke test
│   ├── test-layout.ts                # Gemini layout test
│   └── promote-admin.ts              # Promote user to ADMIN
├── src/
│   ├── app/
│   │   ├── modules/                  # Feature modules
│   │   │   ├── auth/                 # Register, login, JWT, cookies
│   │   │   ├── template/             # Public template list/detail
│   │   │   ├── upload/               # Cloudinary photo upload
│   │   │   ├── poster/               # Poster CRUD + regenerate
│   │   │   ├── generation/           # Gemini layout orchestrator
│   │   │   └── admin/                # Template CRUD + moderation
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts    # Cookie verification + role check
│   │   │   ├── error.middleware.ts   # Central error handler
│   │   │   ├── rateLimit.middleware.ts
│   │   │   └── validateRequest.ts    # Zod validation
│   │   ├── errors/
│   │   │   └── ApiError.ts
│   │   ├── utils/
│   │   │   ├── catchAsync.ts
│   │   │   ├── jwt.ts                # Generic JWT sign/verify
│   │   │   └── sendResponse.ts
│   │   ├── jobs/
│   │   │   ├── generatePoster.job.ts # Async pipeline
│   │   │   └── recovery.job.ts       # Startup stuck-job cleanup
│   │   ├── lib/
│   │   │   ├── prisma.ts             # PrismaClient singleton
│   │   │   ├── cloudinary.ts         # Upload/delete helpers
│   │   │   ├── gemini.ts             # Gemini API client
│   │   │   └── puppeteer.ts          # Browser singleton + semaphore
│   │   └── renderer/
│   │       ├── fonts/                # 6 bundled TTF files
│   │       │   └── font-registry.ts  # Role-based font config
│   │       ├── templates/            # 3 Handlebars .hbs files
│   │       └── render.service.ts     # HTML → PNG
│   ├── config/
│   │   └── index.ts                  # Env config (dotenv)
│   ├── routes/
│   │   └── index.ts                  # Mounts all module routes
│   ├── types/
│   │   └── express.d.ts              # Express Request augmentation
│   ├── app.ts                        # Express app setup
│   └── server.ts                     # HTTP server + recovery
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Database Schema

### Models

#### `User`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `String` (cuid) | Primary key |
| `name` | `String` | 2–80 chars |
| `email` | `String` | **Unique**, used for login |
| `phone` | `String?` | Optional, not unique |
| `passwordHash` | `String` | bcrypt (10 rounds) |
| `role` | `Role` | `USER` | `ADMIN` |
| `createdAt` | `DateTime` | Auto |

**Relationships:** `1:N` with `Poster` (cascade delete).

#### `Template`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `String` (cuid) | Primary key |
| `slug` | `String` | **Unique**, idempotent seeding |
| `title` | `String` | Bangla title |
| `occasionType` | `OccasionType` | Enum |
| `thumbnailUrl` | `String` | UI preview |
| `htmlTemplateKey` | `String` | Maps to `.hbs` file name |
| `layoutConfig` | `Json` | `photoSlots`, `textSlots`, `colorScheme`, `canvas` |
| `cachedDecoration` | `Json?` | Reserved for Phase 2 caching |
| `isActive` | `Boolean` | Soft-delete flag |
| `createdAt` | `DateTime` | Auto |

**Indexes:** `@@index([occasionType, isActive])`  
**Relationships:** `1:N` with `Poster` (`onDelete: Restrict`)

#### `Poster`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `String` (cuid) | Primary key |
| `userId` | `String` | FK → User |
| `templateId` | `String` | FK → Template |
| `formData` | `Json` | `{ name, designation, party, district, headline, ... }` |
| `uploadedPhotoUrls` | `String[]` | Cloudinary URLs |
| `layoutResult` | `Json?` | Gemini's validated layout |
| `generatedImageUrl` | `String?` | Final PNG URL |
| `status` | `PosterStatus` | `DRAFT` | `GENERATING` | `COMPLETED` | `FAILED` |
| `retryCount` | `Int` | Default 0, capped at `MAX_RETRIES` |
| `errorMessage` | `String?` | Populated on failure |
| `isFlagged` | `Boolean` | Moderation flag |
| `createdAt` / `updatedAt` | `DateTime` | Auto |

**Indexes:** `@@index([userId, createdAt(sort: Desc)])`, `@@index([status, updatedAt])`  
**Relationships:** belongs to `User` (cascade) and `Template` (restrict); `1:N` with `GenerationLog` (cascade).

#### `GenerationLog`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `String` (cuid) | Primary key |
| `posterId` | `String` | FK → Poster |
| `geminiPromptUsed` | `String?` | Full prompt for audit |
| `tokensUsed` | `Int?` | Gemini token count |
| `latencyMs` | `Int?` | Gemini round trip |
| `renderMs` | `Int?` | Puppeteer render time |
| `success` | `Boolean` |   |
| `error` | `String?` |   |
| `createdAt` | `DateTime` | Auto |

**Indexes:** `@@index([posterId])`

### Enums

```
enum Role         { USER ADMIN }
enum OccasionType { VICTORY MOURNING CAMPAIGN GREETINGS FESTIVAL }
enum PosterStatus { DRAFT GENERATING COMPLETED FAILED }
```

### State Machine — `Poster.status`

```
   ┌───────┐
   │ DRAFT │  (never used in current flow)
   └───┬───┘
       │
       ▼
┌────────────┐   success   ┌───────────┐
│ GENERATING ├────────────►│ COMPLETED │
└──────┬─────┘             └─────┬─────┘
       │                         │ regenerate
       │ failure                 │
       ▼                         │
   ┌────────┐                    │
   │ FAILED ├────────────────────┘
   └────────┘
```

Only one regenerate can be in-flight per poster — enforced by an atomic `updateMany` guard in `poster.repository.ts`.

### Setup

```
# Apply schema to database
bunx prisma migrate dev --name init

# Seed 3 starter templates
bun run seed
```

---

## Environment Variables

### `.env` template

```
# Server
NODE_ENV=development
PORT=5000
CLIENT_ORIGIN=http://localhost:3000

# Database
DATABASE_URL="postgresql://user:pass@host:5432/poster_maker?sslmode=require"

# Auth
JWT_ACCESS_SECRET=<openssl rand -hex 32>
JWT_REFRESH_SECRET=<openssl rand -hex 32>
JWT_ACCESS_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10

# Gemini
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-3.8-flash

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_FOLDER=poster-maker

# Limits
MAX_RETRIES=3
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_POSTER_MAX=10
RATE_LIMIT_UPLOAD_MAX=30
MAX_UPLOAD_BYTES=5242880
MAX_PHOTOS_PER_POSTER=3
```

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `NODE_ENV` | No | `development` | Toggles cookie `secure` flag |
| `PORT` | No | `5000` |   |
| `CLIENT_ORIGIN` | Yes | — | Must match frontend origin exactly (no trailing slash) for cookies |
| `DATABASE_URL` | Yes | — | Neon/Supabase/Railway Postgres |
| `JWT_ACCESS_SECRET` | Yes | — | ≥32 chars |
| `JWT_REFRESH_SECRET` | Yes | — | ≥32 chars, different from access |
| `GEMINI_API_KEY` | No | `""` | Empty = skip Gemini, use template defaults |
| `GEMINI_MODEL` | No | `gemini-3.8-flash` |   |
| `CLOUDINARY_*` | Yes | — | Free tier at cloudinary.com |
| `MAX_RETRIES` | No | `3` | Regenerate cap per poster |
| `RATE_LIMIT_*` | No | (see above) | Per-user hourly limits |
| `MAX_UPLOAD_BYTES` | No | `5242880` | 5 MB |
| `MAX_PHOTOS_PER_POSTER` | No | `3` | Fallback if template has no `photoSlots` |

---

## Local Setup

```
# 1. Install
cd backend
bun install

# 2. Configure
cp .env.example .env
# Fill in DATABASE_URL, JWT secrets, Cloudinary, Gemini

# 3. Database
bunx prisma generate
bunx prisma migrate dev --name init
bun run seed

# 4. Verify
bun run typecheck
bun run render:sample   # should output 3 PNGs in tmp/samples/
bun run test:layout     # should say "Source: gemini" or "template-default"

# 5. Run
bun dev
```

Health check:

```
curl http://localhost:5000/health
# {"success":true,"data":{"status":"ok","ts":...}}
```

---

## API Reference

Base path: `**/api/v1**`

All responses share this envelope:

```
// Success
{ "success": true, "message"?: string, "data"?: T, "meta"?: object }

// Error
{ "success": false, "message": string, "error"?: object | Array }
```

### Status Codes

| Code | Meaning |
| --- | --- |
| 200 | OK |
| 201 | Created |
| 202 | Accepted (async job started) |
| 204 | No Content (deleted) |
| 400 | Validation failed |
| 401 | Not authenticated / invalid token |
| 403 | Authenticated but not authorized |
| 404 | Not found |
| 409 | Conflict (duplicate email, regenerate in-flight) |
| 413 | Payload too large |
| 429 | Rate limit or retry cap reached |
| 500 | Server error |

---

### Health

#### `GET /health`

Liveness check.

**Request:** none

**Response — 200:**

```
{ "success": true, "data": { "status": "ok", "ts": 1730512345678 } }
```

---

### Auth Endpoints

Cookies are httpOnly. Access token: `accessToken` (path `/`, 1 day). Refresh token: `refreshToken` (path `/api/v1/auth`, 7 days).

#### `POST /auth/register`

**Auth:** public  
**Content-Type:** `application/json`

**Body:**

```
{
  "name": "মোঃ করিম উদ্দিন",
  "email": "karim@example.com",
  "password": "password123",
  "phone": "01712345678"
}
```

| Field | Type | Rules |
| --- | --- | --- |
| `name` | string | 2–80 chars |
| `email` | string | valid email, unique |
| `password` | string | min 8 chars |
| `phone` | string? | 10–20 chars |

**Response — 201:**

```
{
  "success": true,
  "message": "Registered successfully",
  "data": {
    "user": {
      "id": "cm3k9x8v10000abcd",
      "name": "মোঃ করিম উদ্দিন",
      "email": "karim@example.com",
      "phone": "01712345678",
      "role": "USER",
      "createdAt": "2026-10-03T10:15:30.000Z"
    }
  }
}
```

**Set-Cookie:** `accessToken=...; HttpOnly; SameSite=Lax` + `refreshToken=...; HttpOnly; SameSite=Lax; Path=/api/v1/auth`

**Errors:**

*   `400` — validation failed
*   `409` — `Email already registered`

---

#### `POST /auth/login`

**Auth:** public

**Body:**

```
{ "email": "karim@example.com", "password": "password123" }
```

**Response — 200:**

```
{
  "success": true,
  "message": "Logged in successfully",
  "data": { "user": { "id": "cm...", "name": "...", "email": "...", "role": "USER" } }
}
```

**Errors:**

*   `401` — `Invalid email or password`

---

#### `GET /auth/me`

**Auth:** required (cookie)

**Request:** none

**Response — 200:**

```
{
  "success": true,
  "data": {
    "user": {
      "id": "cm...",
      "name": "মোঃ করিম উদ্দিন",
      "email": "karim@example.com",
      "phone": "01712345678",
      "role": "USER",
      "createdAt": "2026-10-03T10:15:30.000Z"
    }
  }
}
```

**Errors:** `401` if no valid cookie.

---

#### `POST /auth/refresh`

**Auth:** requires `refreshToken` cookie

Rotates both tokens. Old refresh token becomes invalid.

**Response — 200:** same shape as login. Sets fresh `accessToken` + `refreshToken` cookies.

**Errors:** `401` if refresh cookie missing or expired.

---

#### `POST /auth/logout`

**Auth:** optional

Clears both cookies.

**Response — 200:**

```
{ "success": true, "message": "Logged out" }
```

---

### Template Endpoints

All require authentication.

#### `GET /templates`

**Query params:**

| Param | Values | Notes |
| --- | --- | --- |
| `occasion` | `VICTORY` | `MOURNING` | `CAMPAIGN` | `GREETINGS` | `FESTIVAL` | Optional filter |

**Response — 200:**

```
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "cm...",
        "slug": "victory-day",
        "title": "মহান বিজয় দিবস",
        "occasionType": "VICTORY",
        "thumbnailUrl": "/templates/victory-day.png"
      },
      { "id": "cm...", "slug": "mourning-tribute", "title": "শোক ও স্মরণ", "occasionType": "MOURNING", "thumbnailUrl": "..." },
      { "id": "cm...", "slug": "campaign-poster", "title": "নির্বাচনী প্রচার", "occasionType": "CAMPAIGN", "thumbnailUrl": "..." }
    ]
  },
  "meta": { "total": 3 }
}
```

**Errors:** `400` if `occasion` is invalid.

---

#### `GET /templates/:id`

**Response — 200:**

```
{
  "success": true,
  "data": {
    "template": {
      "id": "cm...",
      "slug": "victory-day",
      "title": "মহান বিজয় দিবস",
      "occasionType": "VICTORY",
      "thumbnailUrl": "/templates/victory-day.png",
      "htmlTemplateKey": "victory",
      "layoutConfig": {
        "canvas": { "width": 1200, "height": 1600 },
        "photoSlots": [ { "id": "leader1", "x": 180, "y": 200, "w": 380, "h": 480, "shape": "rect" }, { "id": "leader2", "x": 640, "y": 200, "w": 380, "h": 480, "shape": "rect" } ],
        "textSlots": { "headline": { "x": 600, "y": 820, "align": "center", "maxSize": 140 }, "...": {} },
        "colorScheme": { "primary": "#006A4E", "accent": "#F42A41", "text": "#FFFFFF", "background": "#0B3D2E" }
      },
      "isActive": true,
      "createdAt": "2026-10-02T12:00:00.000Z"
    }
  }
}
```

**Errors:** `404` if not found or inactive.

---

### Upload Endpoints

#### `POST /upload`

**Auth:** required  
**Content-Type:** `multipart/form-data`

**Form field:**

| Field | Type | Rules |
| --- | --- | --- |
| `file` | File | JPG / PNG / WebP, max 5 MB, verified by magic bytes |

**Response — 201:**

```
{
  "success": true,
  "message": "File uploaded",
  "data": {
    "url": "https://res.cloudinary.com/xxx/image/upload/v1730.../poster-maker/uploads/cm123/cm123_1730512345678_a1b2c3d4e5f6.jpg",
    "publicId": "poster-maker/uploads/cm123/cm123_1730512345678_a1b2c3d4e5f6",
    "width": 800,
    "height": 600,
    "bytes": 45321,
    "format": "jpg"
  }
}
```

**Errors:**

*   `400` — no file, wrong type, magic byte check failed
*   `401` — not authenticated
*   `413` — file > 5 MB

---

### Poster Endpoints

#### `POST /posters`

**Auth:** required (rate-limited: 10/hour/user)

**Body:**

```
{
  "templateId": "cm3k9x8v10000abcd",
  "formData": {
    "name": "মোঃ করিম উদ্দিন",
    "designation": "সাধারণ সম্পাদক",
    "party": "বাংলাদেশ আওয়ামী লীগ",
    "district": "ঢাকা",
    "headline": "মহান বিজয় দিবস",
    "subheadline": "১৬ ডিসেম্বর"
  },
  "photoUrls": [
    "https://res.cloudinary.com/xxx/image/upload/v.../photo1.jpg"
  ]
}
```

| Field | Type | Rules |
| --- | --- | --- |
| `templateId` | string | must exist + `isActive` |
| `formData.name` | string | 1–80 |
| `formData.designation` | string | 1–80 |
| `formData.party` | string | 1–120 |
| `formData.district` | string? | 1–80 |
| `formData.headline` | string | 1–60 |
| `formData.subheadline` / `slogan` | string? | 1–80 |
| `formData.tribute` | string? | 1–200 |
| `photoUrls` | string\[\] | 0–3, each valid URL, ≤ template photo slot count |

**Response — 202 (Accepted):**

```
{
  "success": true,
  "message": "Poster generation started",
  "data": { "posterId": "cm3k9x8v20000efgh", "status": "GENERATING" }
}
```

Generation runs async. Poll `GET /posters/:id`.

**Errors:**

*   `400` — validation failed, too many photos
*   `401` — not authenticated
*   `404` — template not found or inactive
*   `429` — rate limit exceeded

---

#### `GET /posters/:id`

**Auth:** required (owner or admin)

**Response — 200:**

```
{
  "success": true,
  "data": {
    "poster": {
      "id": "cm...",
      "status": "COMPLETED",
      "generatedImageUrl": "https://res.cloudinary.com/xxx/image/upload/v.../poster_abc_1730.png",
      "retryCount": 0,
      "errorMessage": null,
      "formData": { "name": "মোঃ করিম উদ্দিন", "headline": "মহান বিজয় দিবস", "...": "..." },
      "template": {
        "id": "cm...",
        "title": "মহান বিজয় দিবস",
        "occasionType": "VICTORY"
      }
    }
  }
}
```

`status` is one of `GENERATING` | `COMPLETED` | `FAILED`. If `FAILED`, `errorMessage` explains why.

**Polling strategy:** every 2 seconds, up to 60 seconds. Expected completion in 5–10 seconds.

**Errors:** `401` if not authenticated; `404` if not found or not owned (no existence leak).

---

#### `GET /posters/me`

**Auth:** required

**Query params:**

| Param | Default | Max |
| --- | --- | --- |
| `page` | 1 | — |
| `limit` | 10 | 50 |

**Response — 200:**

```
{
  "success": true,
  "data": {
    "posters": [
      {
        "id": "cm...",
        "status": "COMPLETED",
        "generatedImageUrl": "https://res.cloudinary.com/...",
        "createdAt": "2026-10-03T10:20:00.000Z",
        "formData": { "name": "...", "headline": "...", "...": "..." }
      }
    ]
  },
  "meta": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
}
```

Lightweight — no `template` object, no `layoutResult`.

---

#### `POST /posters/:id/regenerate`

**Auth:** required, owner only  
**Rate limit:** shares poster generation limit

**Body (optional):**

```
{ "formData": { "headline": "বিজয়ের ৫৫ বছর" } }
```

Send `{}` to regenerate with existing data. Send partial `formData` to override fields.

**Response — 202:**

```
{ "success": true, "message": "Regeneration started", "data": { "posterId": "cm...", "status": "GENERATING" } }
```

**Errors:**

*   `401` — not authenticated
*   `404` — poster not found / not owned
*   `409` — already generating (concurrent regenerate)
*   `429` — retry limit reached (default: 3)

---

#### `DELETE /posters/:id`

**Auth:** required (owner or admin)

**Response — 204** (no body).

**Errors:** `404` if not found / not owned.

**Note:** Deleting a poster cascades to its `GenerationLog` rows. Cloudinary assets are **not** deleted automatically in this version — see [Known Limitations](#known-limitations).

---

### Admin Endpoints

All require `role: "ADMIN"`. Promote a user with:

```
bun run promote-admin user@example.com
# then log out + log in to receive a JWT with the ADMIN role
```

#### `GET /admin/templates`

Lists **all** templates including inactive.

**Response — 200:** identical to public list, but each item includes `isActive`, `htmlTemplateKey`, `createdAt`, and `_count.posters`.

---

#### `POST /admin/templates`

**Body:**

```
{
  "slug": "eid-greetings",
  "title": "ঈদ মোবারক",
  "occasionType": "FESTIVAL",
  "thumbnailUrl": "/templates/eid.png",
  "htmlTemplateKey": "victory",
  "layoutConfig": {
    "canvas": { "width": 1200, "height": 1600 },
    "photoSlots": [ { "id": "leader", "x": 400, "y": 180, "w": 400, "h": 480, "shape": "rect" } ],
    "textSlots": { "headline": { "x": 600, "y": 820, "align": "center", "maxSize": 140 } },
    "colorScheme": { "primary": "#0A4D3A", "accent": "#FFD700", "text": "#FFFFFF", "background": "#0B3D2E" }
  }
}
```

**Response — 201** with the created template.

**Errors:** `400` validation; `409` slug conflict.

---

#### `PATCH /admin/templates/:id`

Partial update. Any field from `POST` except `slug`.

**Body example:**

```
{ "title": "ঈদ মোবারক ২০২৬", "isActive": false }
```

**Response — 200** with updated template. `404` if not found.

---

#### `DELETE /admin/templates/:id`

**Soft delete** — sets `isActive = false`. Existing posters remain intact.

**Response — 200:**

```
{ "success": true, "message": "Template deactivated", "data": { "template": { "id": "cm...", "isActive": false } } }
```

**Errors:** `400` if already inactive; `404` if not found.

---

#### `GET /admin/posters`

Moderation queue.

**Query params:**

| Param | Type | Notes |
| --- | --- | --- |
| `flagged` | `true` | `false` | optional filter |
| `page` | int ≥ 1 | default 1 |
| `limit` | int 1–100 | default 20 |

**Response — 200:**

```
{
  "success": true,
  "data": {
    "posters": [
      {
        "id": "cm...",
        "status": "COMPLETED",
        "isFlagged": true,
        "generatedImageUrl": "https://res.cloudinary.com/...",
        "formData": { "headline": "...", "...": "..." },
        "createdAt": "2026-10-03T10:20:00.000Z",
        "user": { "id": "cm...", "name": "...", "email": "..." },
        "template": { "id": "cm...", "title": "...", "occasionType": "VICTORY" }
      }
    ]
  },
  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

---

#### `PATCH /admin/posters/:id/flag`

**Body:**

```
{ "isFlagged": true, "reason": "Inappropriate content" }
```

**Response — 200:**

```
{ "success": true, "message": "Poster flagged", "data": { "poster": { "id": "cm...", "isFlagged": true } } }
```

**Errors:** `400` if state unchanged; `404` if not found.

---

#### `DELETE /admin/posters/:id`

Hard delete. Cascades to `GenerationLog`.

**Response — 204**.

---

## Poster Generation Pipeline

### Flow

```
POST /posters (202 Accepted)
     │
     ▼
create Poster row (status = GENERATING)
     │
     │  fire-and-forget
     ▼
runPosterGeneration(posterId)
     │
     ├─► 1. Load poster + template
     │
     ├─► 2. generationService.resolveLayout()
     │      │
     │      ├─► Try Gemini (15s timeout, 2 attempts, Zod-validated)
     │      │   │
     │      │   ├─ Valid → return layout (source = "gemini")
     │      │   └─ Fail → fall back to template defaults
     │      │
     │      └─► Always returns a valid layout
     │
     ├─► 3. Persist layout to Poster.layoutResult
     │
     ├─► 4. renderPosterToPng(layout + user data)
     │      │
     │      ├─► Puppeteer semaphore (max 2 concurrent)
     │      ├─► Load Handlebars template
     │      ├─► Inject bundled fonts as @font-face
     │      ├─► waitUntil: "load" + document.fonts.ready
     │      ├─► Wait for <img> tags to finish loading
     │      └─► Screenshot at 1200×1600 → Buffer
     │
     ├─► 5. uploadBuffer(png, folder: posters/<userId>)
     │
     └─► 6. markCompleted(posterId, url, log)  [DB transaction]
```

On any error: `markFailed(posterId, message)` + `GenerationLog(success: false)`.

### Startup Recovery

On server boot, `recoverStuckPosters()` runs and marks posters stuck in `GENERATING` > 5 minutes as `FAILED` with `errorMessage: "Generation timed out or was interrupted"`. Prevents zombie rows after crashes.

---

## Gemini Integration

### Model

`gemini-3.8-flash` — free tier, vision-capable, fast.

### What Gemini Does

Receives the occasion, headline, word count, photo count, and template's base palette.

Returns **strictly-shaped JSON**:

```
{
  "palette": {
    "primary": "#006A4E",
    "accent": "#FFD700",
    "text": "#FFFFFF",
    "background": "#0A2A1F"
  },
  "photoCrops": [
    { "slot": 0, "focusX": 0.5, "focusY": 0.3, "zoom": 1.1 },
    { "slot": 1, "focusX": 0.5, "focusY": 0.35, "zoom": 1.0 }
  ],
  "decorations": ["national_flag"],
  "headlineStyle": { "size": 140, "shadow": "heavy" }
}
```

### What Gemini Does **Not** Do

*   Does not draw the image
*   Does not draw text
*   Does not know the user's spelling

Bangla text is rendered by Puppeteer, guaranteeing correct conjuncts and spelling.

### Guardrails

*   **Zod validation** against `geminiLayoutSchema` — rejects malformed output
*   **Two attempts**, 15-second timeout each
*   **Fallback** to template defaults on failure — the poster still renders
*   **Code-fence stripping** — handles models that ignore `responseMimeType: "application/json"`

### Prompt Design

The system prompt provides **creative latitude** ("choose colors that fit the occasion") rather than asking Gemini to echo the base palette. The user prompt includes headline word count so Gemini can size the headline appropriately (short = bigger, long = smaller).

### Cost Control

*   Rate limiting: 10 poster generations per user per hour
*   AI is off the critical path — no user is ever blocked by Gemini

### Optional

If `GEMINI_API_KEY` is empty, `isGeminiConfigured()` returns `false` and the layout resolver skips the API entirely, using template defaults. The pipeline is fully functional without Gemini.

---

## Font System

### Role-Based Registry

Fonts are referenced **by role** (`headline`, `name`, `footer`, `accent`, `serif`, `fallback`), never by name. Templates use CSS variables fed from `font-registry.ts`.

```
// font-registry.ts — THE single source of truth
export const FONT_REGISTRY: Record<FontRole, FontFace> = {
  headline:  { family: "Anek Bangla",       weight: 800, file: "AnekBangla-ExtraBold.ttf" },
  accent:    { family: "Galada",             weight: 400, file: "Galada-Regular.ttf" },
  name:      { family: "Hind Siliguri",      weight: 600, file: "HindSiliguri-SemiBold.ttf" },
  footer:    { family: "Hind Siliguri",      weight: 500, file: "HindSiliguri-Medium.ttf" },
  serif:     { family: "Noto Serif Bengali", weight: 400, file: "NotoSerifBengali-Regular.ttf" },
  fallback:  { family: "Noto Sans Bengali",  weight: 400, file: "NotoSansBengali-Regular.ttf" },
};
```

### Bundled Files

All under `src/app/renderer/fonts/`. Six `.ttf` files, SIL OFL licensed, safe for commercial use.

### Swapping Fonts

Change one entry in `FONT_REGISTRY` — every template updates automatically. `buildFontsCss()` regenerates the `@font-face` block from the registry, so the CSS and the registry never drift apart.

---

## Error Handling

### Central Handler

All errors funnel through `error.middleware.ts`, which formats a consistent response.

### Custom `ApiError`

```
throw new ApiError(404, "Poster not found");
```

Produces:

```
{ "success": false, "message": "Poster not found" }
```

### Zod Errors

Automatically converted to **400** with field-level detail:

```
{
  "success": false,
  "message": "Validation failed",
  "error": [
    { "path": "email", "message": "Invalid email" },
    { "path": "password", "message": "Password must be at least 8 characters" }
  ]
}
```

### Multer Errors

Automatically converted to **413** or **400**.

### Unknown Errors

**500** with sanitized message (real message shown only in `development`).

### Never Leak

*   `passwordHash` is never returned in any response (a `sanitize()` helper strips it).
*   Ownership failures return **404**, not **403**, to avoid leaking resource existence.

---

## Rate Limiting

Two limiters, both keyed by `req.user.id` (falls back to `req.ip`):

| Limiter | Applied To | Default |
| --- | --- | --- |
| `posterGenerationLimiter` | `POST /posters`, `POST /posters/:id/regenerate` | 10 / hour / user |
| `uploadLimiter` | `POST /upload` | 30 / hour / user |

Over the limit → **429** with `{ "success": false, "message": "Too many ... Please try again later." }`

Rate limit state is **in-memory** — resets on server restart. For production, migrate to Redis via `rate-limit-redis`.

---

## Known Limitations

### MVP Scope

These were **intentionally deferred** per the PRD's Section 7 task breakdown and the planning document's Section 1.2:

| Feature | Status |
| --- | --- |
| Admin UI | **Deferred** — backend API is complete; frontend panel is Phase 9 |
| Moderation queue UI | **Deferred** — API exists (`GET /admin/posters?flagged=true`) |
| Usage analytics dashboard | **Deferred** |
| PDF export | **Deferred** — PNG only in MVP |
| Bulk CSV generation | **Deferred** |
| bKash / Nagad payments | **Deferred** |
| Watermark tiers | **Deferred** |
| Bangla font picker for end-users | **Deferred** — fonts are curated per template |
| Phone/OTP login | **Deferred** — email + password only |
| Redis + BullMQ job queue | **Deferred** — in-process async for MVP |

### Technical Limitations

**Cloudinary cleanup on delete.** Deleting a poster removes the DB row but does **not** delete the Cloudinary assets. A cleanup helper (`deleteAssetsByUrls`) exists in `lib/cloudinary.ts` and is ready to wire in. Fix in Phase 2.

**In-memory rate limiting.** Resets on restart. Fine for MVP; migrate to Redis for multi-instance deployments.

**Single-process async job.** Long-running generations live in the API process. A restart mid-generation loses the job (mitigated by startup recovery, which marks them `FAILED`).

**No CSRF protection.** Cookies are `SameSite=Lax`, which prevents cross-site POST attacks for most cases. For a public launch, add a CSRF token.

**No request-id tracing.** Errors are logged but not correlated across a request. Add a `req.id` middleware for production.

**Decorations partially rendered.** Gemini suggests `decorations[]` (rice paddy, dove, etc.) but templates only consume `palette`, `headlineStyle`, and `photoCrops`. Decorations require SVG assets, deferred to Phase 2.

`**zoom**` **on photo crops not applied.** The `photoCrops[].zoom` value is passed to the renderer but templates only use `object-position`. Full zoom requires a wrapping `overflow: hidden` container.

**Template slot geometry is hardcoded in** `**.hbs**`**.** The `layoutConfig.photoSlots` values in the DB don't drive the template CSS — the CSS is authored manually. A fully dynamic renderer (that reads slot positions from `layoutConfig`) is a Phase 2 refactor.

### Security Notes

*   JWT secrets **must** be 32+ characters. Generate with `openssl rand -hex 32`.
*   Passwords hashed with bcrypt rounds.
*   Uploaded files verified by **magic bytes**, not just MIME type — a `.txt` renamed to `.jpg` is rejected.
*   Users cannot read or delete another user's posters (`404`, not `403`).
*   Admin actions require both authentication and `role === "ADMIN"`.

---

## Future Roadmap

### Phase 2 (post-deadline)

*   **Admin UI** — Next.js pages for template CRUD + moderation queue
*   **Cloudinary cleanup** — wire `deleteAssetsByUrls` into delete flows
*   **PDF export** — `page.pdf()` in Puppeteer, alongside PNG
*   **Decorations** — SVG assets + template rendering
*   **Full dynamic slot geometry** — read `layoutConfig.photoSlots` in templates
*   **Redis + BullMQ** — offload generation to a worker queue
*   **CSRF protection** — token-based, stored in a cookie

### Phase 3 (nice-to-have)

*   **Bulk CSV generation** — upload a CSV of names + designations, get back a ZIP of posters
*   **Payment gateway** — bKash / Nagad for premium templates and high-res export
*   **Watermark tiers** — FREE (watermarked) vs PREMIUM (clean)
*   **Bangla font picker** — per-user font selection for headlines
*   **OTP login** — phone-based auth via SMS gateway

---

## Scripts

| Command | Purpose |
| --- | --- |
| `bun dev` | Start with hot reload (`tsx watch`) |
| `bun run typecheck` | `tsc --noEmit` — verify types |
| `bun run build` | Compile to `dist/` |
| `bun start` | Run via Bun (no build step) |
| `bunx prisma studio` | GUI to browse the database |
| `bunx prisma generate` | Regenerate Prisma client after schema change |
| `bunx prisma migrate dev --name <name>` | Create + apply a migration |
| `bun run seed` | Insert 3 starter templates (idempotent) |
| `bun run render:sample` | Render 3 sample PNGs → `tmp/samples/` |
| `bun run test:layout` | Test Gemini layout resolver (with or without key) |
| `bun run promote-admin <email>` | Promote a user to ADMIN |

---

## License

Internal project. Fonts bundled under SIL OFL. See individual font files for attribution.

---

## Contributors

Built during the Oct 2026 SDLC planning sprint. Two-project layout:

*   `backend/` — this API
*   `frontend/` — Next.js client (separate project)