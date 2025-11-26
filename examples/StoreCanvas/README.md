# StoreCanvas Example

Full-stack sample that pairs a Fastify + TypeScript backend with a Next.js + Tailwind client to generate, manage, and export app store visuals using Linconwaves AI Workers.

## Architecture
- Backend (`server/`): Fastify API with routes for auth, projects, designs, uploads, presets, and AI operations. Calls AI Workers for background generation, copy suggestions, and img2img/inpainting. Uses storage abstraction (Supabase, Cloudflare R2, or AWS S3) and repository pattern for DB providers.
- Frontend (`client/`): Next.js app that hits the API at `NEXT_PUBLIC_API_BASE_URL` and surfaces design editing/export flows.
- Shared contracts: the client consumes the REST API; see `client/lib/api.ts` for endpoints.

## Run locally
Backend:
1. `cd server`
2. `npm install`
3. Copy `.env.example` to `.env` and fill in AI Workers keys, model IDs, DB, and storage.
4. `npm test`
5. `npm run dev`

Frontend:
1. `cd client`
2. `npm install`
3. Copy `.env.local.example` to `.env.local` and set `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:4000`).
4. `npm run dev`

## Environment highlights
- AI Workers: `AIWORKERS_BASE_URL`, `AIWORKER_API_KEY`, model IDs for background, img2img, inpaint, and style LLM.
- Storage: choose `supabase`, `cloudflare_r2`, or `aws_s3` and set matching credentials.
- DB: choose `mongodb`, `postgres`, or `supabase` via `DB_PROVIDER` and related URLs.

## Testing
- Backend: `npm test`
- Frontend: `npm run lint` and `npm run typecheck`

## Where to start hacking
- Backend: `server/src/ai/aiWorkersClient.ts` for AI calls, `server/src/designs/service.ts` for render/export flow.
- Frontend: `client/app/dashboard` and `client/app/projects` pages for primary UI flows.
