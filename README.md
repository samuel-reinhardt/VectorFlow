# VectorFlow

A collaborative, Google Drive-backed workflow visualizer built on **Next.js 15** and deployed to **Cloudflare Pages**. Create flowcharts, attach metadata and deliverables to steps, and share projects via Drive links or a built-in discovery registry.

---

## Quick Start

```bash
pnpm install
cp .env.local.example .env.local  # fill in values — see Configuration below
pnpm dev
```

Opens at **http://localhost:9002**.

> **No Cloudflare account needed for local development.** The KV discovery store falls back to an in-memory Map automatically during `next dev`.

---

## Project Blueprint

```
src/
├── app/
│   ├── api/
│   │   ├── auth/callback/     # Google OAuth redirect handler
│   │   ├── discovery/         # KV-backed file discovery registry (GET/PUT/DELETE)
│   │   ├── drive/share-sa/    # Grants service account reader access to a file
│   │   ├── proxy-drive/       # Edge proxy for Drive content/metadata/permissions
│   │   └── projects/          # Project CRUD helpers
│   └── page.tsx               # Entry — renders <VectorFlow />
├── components/
│   ├── flow/                  # ReactFlow canvas, nodes, edges, tabs
│   ├── panels/                # Settings, outline, read-only properties
│   ├── drive/                 # Drive browser dialog, discovery panel
│   ├── sync/                  # Sync indicator, reconnect dialog, sync popover
│   └── layout/                # Header, toolbar, file menu
├── hooks/
│   ├── flow/                  # use-flow-state, use-flow-persistence, use-flow-transition
│   ├── nodes/                 # use-node-operations, use-node-layout, use-group-operations
│   ├── edges/                 # use-edge-operations
│   ├── deliverables/          # use-deliverable-operations
│   ├── metadata/              # use-metadata-operations
│   └── *.ts                   # use-vector-flow, use-drive-sync, use-clipboard, …
└── lib/
    ├── google-drive/
    │   ├── service.ts          # Client-side Drive API wrapper
    │   ├── service-account.ts  # Edge-compatible SA JWT auth (crypto.subtle)
    │   └── user-token.ts       # Shared session-cookie → access token helper
    ├── kv-store.ts             # Cloudflare KV client with local in-memory fallback
    └── storage.ts              # localStorage persistence
```

---

## Configuration

Copy `.env.local` and fill in the values. All variables are **server-side only** unless prefixed `NEXT_PUBLIC_`.

### Required — Google OAuth

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | OAuth 2.0 client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 client secret |
| `SESSION_SECRET` | 32-byte hex string used to sign the `vf_session` HttpOnly cookie. Generate with `openssl rand -hex 32` |

### Required — Google Service Account (Drive proxy)

The app uses a service account to read Drive files on behalf of users, keeping OAuth scopes minimal (`drive.file` only for writes).

| Variable | Description |
|---|---|
| `GOOGLE_SA_EMAIL` | Service account `client_email` |
| `GOOGLE_SA_KEY_ID` | Service account `private_key_id` |
| `GOOGLE_SA_PRIVATE_KEY` | PEM private key with literal `\n` for newlines |

**Setup:**
1. Google Cloud Console → IAM & Admin → Service Accounts → Create
2. Keys → Add Key → JSON → download
3. Copy `client_email`, `private_key_id`, `private_key` into the vars above
4. Enable the **Google Drive API** for the project

### Optional — Cloudflare KV (Discovery registry)

No extra env vars are needed locally — the KV store uses an in-memory fallback.

For production, create the namespaces and paste the IDs into `wrangler.toml`:

```bash
wrangler kv:namespace create VF_DISCOVERY
wrangler kv:namespace create VF_DISCOVERY --preview
```

---

## Development

```bash
pnpm dev          # Next.js dev server with Turbopack at :9002
pnpm typecheck    # TypeScript — must pass before committing
```

### Auth flow locally

The OAuth callback redirects to `http://localhost:9002/api/auth/callback`. Add this URI to your Google Cloud OAuth client's **Authorized redirect URIs**.

### Drive proxy locally

`/api/proxy-drive` runs as a Next.js Edge route. The service account path works identically in `next dev` — set the three `GOOGLE_SA_*` vars and it will sign JWTs and exchange them with Google's token endpoint.

For files not yet shared with the SA, the proxy automatically falls back to the user's session refresh token.

### Discovery locally

The KV store detects when it's running outside a Cloudflare Worker and switches to an in-memory `Map`. Data is **not persisted** between restarts in this mode — this is intentional for local dev.

---

## Deployment

### Cloudflare Pages

```bash
# Build the edge bundle
pnpm pages:build

# Build + deploy in one step
pnpm pages:deploy
```

**Environment variables** must be set in the Cloudflare Pages dashboard under **Settings → Environment variables** (same names as above, under Production and Preview).

**KV binding** is wired automatically via `wrangler.toml` once the namespace IDs are filled in — no additional dashboard config needed.

### Standard Node.js

```bash
pnpm build
pnpm start
```

> Note: the Edge API routes (`/api/discovery`, `/api/proxy-drive`, etc.) use `export const runtime = 'edge'` and require a runtime that supports the Web Crypto API.

---

## Key Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Local dev server (Turbopack, port 9002) |
| `pnpm typecheck` | Run `tsc --noEmit` |
| `pnpm build` | Production Next.js build |
| `pnpm pages:build` | Compile for Cloudflare Pages edge runtime |
| `pnpm pages:deploy` | Build + deploy to Cloudflare Pages via Wrangler |
