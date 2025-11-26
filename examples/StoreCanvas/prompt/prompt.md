You are an expert backend engineer. Build a production-ready backend service for a web app called **StoreCanvas**.

High-level product:
- StoreCanvas lets authenticated users create and manage **app store visual assets**:
  - App Store screenshots and featured images.
  - Google Play screenshots and **feature graphics**.
  - Optional base app icon layouts.
- Users can:
  - Start from a blank canvas or existing screenshot.
  - Use AI to generate or enhance **backgrounds**, gradients, and overlays.
  - Add and position logos, small text, device frames, and UI overlays.
  - Resize and export assets to **exact App Store and Play Store requirements** without losing sharpness.
  - Generate multiple sizes (Apple + Google) from a single master design.

Use the Linconwaves **AI Workers** API:
- Base URL: `https://aiworker.linconwaves.com` (configurable via env).
- API key via `Authorization: Bearer <AIWORKER_API_KEY>`.
- Use image models from the catalog (slug configurable via env), for example:
  - `Stable Diffusion XL Base 1.0`
  - `Sdxl Lightning`
  - `Lucid Origin`
  - `Phoenix 1p0`
  - `Sd V1 5 Img2img`
  - `Sd V1 5 Inpainting`
- Also allow a text model (e.g. `Llama 3.1 8B Instruct`, `Gemma 3 12b It`, `Mistral Small 3p1 24b`) for:
  - Prompt rewriting.
  - Copy suggestions (short taglines, feature bullets).
  - Color palette / style suggestions.
- All model IDs (Workers slugs) must be **configurable** via env:
  - `AIWORKERS_BASE_URL`
  - `AIWORKER_API_KEY`
  - `BACKGROUND_MODEL_ID`
  - `IMG2IMG_MODEL_ID`
  - `INPAINT_MODEL_ID`
  - `STYLE_LLM_MODEL_ID` (or reuse `BACKGROUND_MODEL_ID` if it’s a chat model).

Tech & architecture:
- Use **TypeScript** and **Node.js**.
- Pick a modern framework (Fastify or NestJS) and stick to it; structure code clearly:
  - `auth/`
  - `projects/`
  - `designs/`
  - `presets/`
  - `ai/`
  - `uploads/`
  - `storage/`
  - `config/`
  - `logging/`
- Provide:
  - Central configuration module reading from `process.env`.
  - Startup-time validation of required env vars (fail fast).
  - Central error handler with structured error responses.
  - Structured logging (e.g. pino) with request correlation IDs.
  - Basic rate limiting per authenticated user + per IP.

Authentication:
- Use **Better Auth** for login & signup (email/password and optional social providers).
- Store:
  - `User`: `id`, `email`, `name`, `role` (`user | admin`), `createdAt`, `updatedAt`.
- All asset/design APIs must be **authenticated** (except landing/health).

Database:
- Allow one of **MongoDB / Postgres / Supabase** as the primary DB, selected by env:
  - `DB_PROVIDER` ∈ `mongodb | postgres | supabase`.
- Connection:
  - MongoDB: `MONGODB_URI`.
  - Postgres: `DATABASE_URL`.
  - Supabase: treat as Postgres with `SUPABASE_DB_URL` or reuse `DATABASE_URL`.
- Implement repository interfaces and then provider-specific implementations:
  - `UserRepository`
  - `ProjectRepository`
  - `DesignRepository`
  - `AssetExportRepository`
  - `UploadRepository`
- It’s okay to fully implement one provider and stub others with clear TODOs, as long as the interface boundaries are clean.

Storage:
- Object storage for **images** and design exports:
  - `STORAGE_PROVIDER` ∈ `supabase | cloudflare_r2 | aws_s3`.
- Implement a `StorageClient` abstraction:
  - `uploadImage(buffer, contentType): Promise<{ url, key }>`
  - `uploadExport(buffer, contentType): Promise<{ url, key }>`
  - `deleteObject(key)`
- Providers:
  - Supabase Storage: bucket name + public URL base from env.
  - Cloudflare R2: account ID, access keys, bucket, and optional public base URL.
  - AWS S3: region, credentials, bucket, optional CDN base URL.

Key domain concepts:
- **Project** (an app or brand):
  - `id`
  - `userId`
  - `name` (e.g. “My Finance App”)
  - `platforms` (e.g. `['ios', 'android']`)
  - `brandKit` JSON:
    - Primary/secondary colors
    - Gradient presets
    - Logo references
    - Preferred fonts (as tokens / names)
  - `defaultScreenshotBackgroundStyle` (text description)
  - `createdAt`, `updatedAt`

- **Design** (a single composition used to generate multiple outputs):
  - `id`
  - `projectId`
  - `name` (e.g. “Feature Graphic v1”)
  - `type` (`feature_graphic | phone_screenshot | tablet_screenshot | app_icon_layout | custom`)
  - `baseWidth`, `baseHeight` (internal canvas size, e.g. high-res base like 3840x2400)
  - `layers` JSON (front-end friendly structure with types: `background`, `gradient`, `image`, `logo`, `text`, `shape`, `overlay`):
    - Each layer: id, type, position (x,y), size (width,height), rotation, z-index, opacity, etc.
    - For image layers: source object key/URL + fit mode (cover/contain).
    - For gradient: colors, direction, stops.
    - For text: content, font family, weight, size, color, alignment.
  - `aiMetadata` JSON (prompts used, model IDs, last AI operations).
  - `status` (`draft | ready | archived`).
  - `createdAt`, `updatedAt`.

- **SizePreset**:
  - `id`
  - `code` (e.g. `apple_iphone_6_7_portrait`, `google_play_feature_graphic`, `google_play_phone_screenshot`)
  - `store` (`apple_app_store | google_play`)
  - `label` (human readable)
  - `width`, `height`
  - `aspectRatio`
  - `format` hints (`png | jpeg`)
  - `category` (`screenshot | feature_graphic | tv_banner | icon`)

  Include presets for:
  - Apple App Store phone screenshots:
    - 6.7" iPhone: 1290 x 2796 px (portrait), 2796 x 1290 px (landscape). :contentReference[oaicite:0]{index=0}
    - 6.5" iPhone: 1284 x 2778 px (portrait), 2778 x 1284 px (landscape). :contentReference[oaicite:1]{index=1}
    - 5.5" iPhone (classic): 1242 x 2208 px (portrait), 2208 x 1242 px (landscape). :contentReference[oaicite:2]{index=2}
  - Apple iPad 12.9" screenshot class (use current official dimensions from Apple docs). :contentReference[oaicite:3]{index=3}
  - Google Play **feature graphic**:
    - 1024 x 500 px, JPEG or 24-bit PNG with **no alpha**. :contentReference[oaicite:4]{index=4}
  - Google Play phone/tablet screenshots:
    - Constraint: minimum dimension 320 px, maximum 3840 px, aspect ratio up to 2:1. :contentReference[oaicite:5]{index=5}
  - Google Play app icon 512 x 512 (optional “layout helper”). :contentReference[oaicite:6]{index=6}

- **AssetExport**:
  - `id`
  - `designId`
  - `sizePresetId`
  - `store` / platform
  - `outputUrl`
  - `format` (`png | jpeg`)
  - `width`, `height`
  - `createdAt`
  - `generatedByJobId` (for job tracking)

- **Upload**:
  - `id`
  - `userId`
  - `projectId`
  - `type` (`logo | screenshot | background | other`)
  - `storageKey`
  - `url`
  - `width`, `height` (if known)
  - `createdAt`

AI features (backend responsibilities):
- Given a **prompt** and brand kit, generate a **background image** at high resolution (e.g. 3840x2400).
- Given a base screenshot + user description, call img2img/inpainting to:
  - Clean up clutter.
  - Add subtle gradient overlays and lighting.
  - Keep UIs legible.
- Provide an endpoint that:
  - Takes a `Design` JSON with layer info.
  - Renders a **master composition** off-screen (on the server) at base resolution.
  - Downscales or crops to specific `SizePreset` resolutions while preserving sharpness (never upscale beyond base).
- Use the text model to:
  - Suggest taglines or short phrases that fit a given character limit.
  - Suggest color palettes and gradient configurations.

API design (REST, JSON, with authentication via cookies or tokens):

Auth:
- `/auth/signup`
- `/auth/login`
- `/auth/logout`
- `/auth/me`
(Reuse Better Auth handlers where possible.)

Projects:
- `GET /projects` – list user projects.
- `POST /projects` – create a project:
  - Body: `name`, `platforms`, `brandKit` (colors, logos, fonts).
- `GET /projects/:id`
- `PUT /projects/:id` – update brand kit, name, platforms.
- `DELETE /projects/:id`

Uploads:
- `POST /uploads` – signed URL or direct upload handler for logos/screenshots:
  - Accepts multipart form-data or request for a signed upload URL.
  - On completion, store `Upload` record with URL and metadata.
- `GET /uploads` – list user uploads (paginated).

Presets:
- `GET /size-presets` – list available presets (filter by store, type).

Designs:
- `GET /projects/:projectId/designs`
- `POST /projects/:projectId/designs`
  - Body:
    - `name`
    - `type`
    - `baseWidth`, `baseHeight`
    - `layers` JSON (initial composition)
- `GET /designs/:id`
- `PUT /designs/:id` – update name, type, layers, aiMetadata.
- `DELETE /designs/:id`

AI-enhanced operations:
- `POST /designs/:id/generate-background`
  - Body: optional override prompt + style hints.
  - Uses AI image model to generate a background at base resolution.
  - Returns updated `Design` with a new `background` layer and stores the generated background in object storage.
- `POST /designs/:id/suggest-copy`
  - Body: context (store, platform, short copy goal).
  - Calls LLM to propose 2–3 tagline options.
- `POST /designs/:id/apply-img2img`
  - Body: which layer/image to refine and instructions (`soft lighting`, `clean UI`, etc.).
  - Uses img2img/inpainting to enhance that section.

Rendering & export:
- `POST /designs/:id/export`
  - Body:
    - `sizePresetCodes: string[]` (e.g. `["apple_iphone_6_7_portrait", "google_play_feature_graphic"]`)
    - `format` (`png | jpeg`) with validation against store constraints.
  - Backend:
    - Loads design, layers, assets.
    - Renders base composition at `baseWidth x baseHeight` (server-side).
    - For each preset:
      - Downscale/crop to target size (no upscaling beyond base).
      - Ensure spec compatibility (dimensions/ratio/format).
      - Upload output to storage and create `AssetExport` records.
    - Returns exports metadata + URLs.
- `GET /designs/:id/exports` – list exports with filters (by preset, createdAt).

Validation & compliance:
- When exporting, validate against known store rules:
  - Apple:
    - Width/height must match preset exactly.
    - Format allowed: PNG or JPEG, no transparent backgrounds. :contentReference[oaicite:7]{index=7}
  - Google Play:
    - For feature graphics: 1024x500, JPEG or 24-bit PNG with no alpha. :contentReference[oaicite:8]{index=8}
    - For screenshots: 320–3840 px, longest side ≤ 2x shortest side. :contentReference[oaicite:9]{index=9}
- Return clear error messages if the user tries to export invalid sizes/formats.

Security & limits:
- Ensure all project/design endpoints require an authenticated user, and **ownership checks** so users only see their own content.
- Implement per-user quotas:
  - Max projects.
  - Max AI generations per day.
  - Max storage usage (approximate).
- Implement input validation with a schema library (Zod/Yup or framework equivalent).

Testing:
- Unit tests for:
  - `AiWorkersClient` (mock HTTP).
  - `DesignService` (composition and export logic).
  - `PresetService` (validation against store rules).
- Integration tests for:
  - Auth flows.
  - Project + design creation.
  - Export endpoint (mocking AI/image generation but verifying size/format logic).

Output:
- Generate the full backend project (directory structure, `package.json`, `.env.example`, config, module scaffolding, and tests).
- Do **not** include explanations or commentary in your output; just produce the project code and files implementing this spec.