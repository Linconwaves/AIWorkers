# Roadmap (example)

Use this as a starting point for the repo wiki. Edit and expand as priorities change.

## Near term (0–2 weeks)
- Docs polish: add quickstarts for `callai` and `storygenerator`.
- Developer ergonomics: seed data script and one-click local setup.
- Testing: expand coverage for AI Workers client error handling and design export validation.

## Mid term (2–6 weeks)
- Auth hardening: session rotation, refresh tokens, and CSRF defenses for the client.
- Storage adapters: finalize R2/S3 parity and document CDN configuration.
- Observability: request tracing and structured metrics for AI calls and exports.
- Frontend UX: richer design previews and export progress states.

## Longer term
- Multi-tenant support: orgs, roles, and billing hooks.
- Pluggable AI strategies: model selection per project and cost tracking.
- Deploy recipes: Terraform/Docker samples for common clouds.
- Template gallery: shareable design/preset packs with import/export.

## How to propose changes
- Open an issue with the milestone you think fits.
- Start a discussion on tradeoffs (scope, dependencies, rollout).
- Submit PRs that tackle one roadmap item at a time.
