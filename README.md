# AI Workers samples

Sample projects that show how to wire Linconwaves AI Workers into real workflows. Fork them, swap in your own prompts and UI, and ship AI-powered features fast.

- `examples/StoreCanvas`: Full-stack reference app for generating and exporting app-store ready visuals with AI (Fastify + TypeScript backend, Next.js + Tailwind client).
- `examples/callai`, `examples/storygenerator`: Additional playgrounds for experimenting with the platform.

See the platform at https://ai.linconwaves.com and developer docs at https://developers.linconwaves.com.

## StoreCanvas at a glance
- Authenticated workspace for projects and designs.
- AI Workers calls for background generation, copy suggestions, and img2img/inpainting.
- Size preset validation for Apple App Store and Google Play exports.
- Object storage abstraction for Supabase, Cloudflare R2, or AWS S3.
- Configurable model slugs and base URL via environment variables.

## Quick start (StoreCanvas)
Prereqs: Node 18+, npm, a Linconwaves AI Workers API key, and credentials for one storage provider (Supabase, R2, or S3).

### Backend (`examples/StoreCanvas/server`)
1. `cd examples/StoreCanvas/server`
2. `npm install`
3. Copy `.env.example` to `.env` and fill in your AI Workers key, model IDs, DB, and storage settings.
4. Run tests: `npm test`
5. Start the API: `npm run dev` (listens on port 4000 by default)

### Frontend (`examples/StoreCanvas/client`)
1. `cd examples/StoreCanvas/client`
2. `npm install`
3. Set `NEXT_PUBLIC_API_BASE_URL` (e.g., `http://localhost:4000`) in `.env.local`
4. Start the app: `npm run dev` (Next.js 13)

## Configure AI Workers
The backend expects:
- `AIWORKERS_BASE_URL` (defaults to `https://aiworker.linconwaves.com`)
- `AIWORKER_API_KEY` (Bearer token)
- Model IDs for `BACKGROUND_MODEL_ID`, `IMG2IMG_MODEL_ID`, `INPAINT_MODEL_ID`, and `STYLE_LLM_MODEL_ID`

Grab model slugs and usage examples from https://developers.linconwaves.com.

## Use these samples in your own product
1. Fork the repo and duplicate the relevant example folder.
2. Swap prompts, UI, and branding to match your workflow.
3. Fill in environment variables and point the client at your backend.
4. Deploy the backend to your host of choice and the client to Vercel/Netlify; update `NEXT_PUBLIC_API_BASE_URL`.

## Contributing
Issues and PRs are welcome. See `CONTRIBUTING.md` for how to file bugs, propose ideas, and open pull requests.

## License
MIT — see `LICENSE`.
