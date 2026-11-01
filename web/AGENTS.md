# Web library ownership

The user explicitly authorized this standalone web application in the repository root.
This directory does not implement MSW gameplay and does not require Maker sessions.

- Edit only `web/` for portal tasks. Keep gameplay and concurrent workers' files untouched.
- The repository is public. The user chose **source only in GitHub; all assets and audit data stay private**.
- Never stage `content/`, `dist/`, `.vercel/`, `.env*`, screenshots, videos or bundles. Do not use `git add -f`.
- Commit frontend, build scripts, schemas/templates and documentation only.
- Vercel project `catch-and-keep-library` must use Authentication → All Deployments before upload.
- `npm run publish` verifies that protection, checks the Git boundary, builds and uploads only prebuilt static output.
- On approved content delivery, refresh the relevant private package, run import/build, inspect the changed views, then publish.
- Effect-slot comparison data comes from `npm run slots -- --game <checkout>` (read-only on the game checkout; output stays in `content/`). Keep slot names/order in `scripts/slot-defs.mjs`. Do not rerun gameplay merely to update this library.
- A source-only Git push is not a content publication. Automatic Git deployment is disabled because the private bundle is intentionally absent from public Git.
- Preserve snapshot date/source version, distinguish produced/connected/actually observed/accepted, and retain explicit missing data.
- Never infer a map is applied or an animation was tested from a catalog entry alone.
