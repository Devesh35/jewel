# Backend coding practices (agent guide)

This backend is Express + TypeScript + MongoDB with feature-flagged integrations. Use this as a fast checklist when you code.

## Environment and config

- Source of truth: `src/config/env.ts` (Zod). Add vars there; mirror in `.env.example` with placeholders.
- Always consume env/config via the `env`/`appConfig` exports from `src/config/env.ts` (avoid direct `process.env` reads elsewhere).
- Prefer feature flags `ENABLE_<FEATURE>` for optional pieces.
- Use `appConfig` (base URL, isProduction, features) instead of re-reading env.

## Application entry

- `src/index.ts`: bootstrap + graceful shutdown hooks.
- `src/core/app.ts`: create Express app, `setupPlugins`, mount `rootRouter`, connect Mongo, attach global error handling.
- `src/core/plugins.ts`: helmet, CORS (allowlists/regex), rate limit, request logging, body parsers, cookie parser, query parser.
- `src/core/db.ts`: Mongo connect/disconnect; `src/core/dbIndexes.ts` for index seeding.

## Routing layout

- `rootRouter` (`/` + `/api`). `welcomeRoute` is public; everything else under `/api`.
- `apiRouter` → `v1Router`: mount modules at `/api/v1/<module>`. Add new APIs to a versioned router, not root.
- Whenever you add/update/remove routes, update `postman_collection.json` so the Postman collection stays in sync.

## Modules (default pattern)

- Location: `src/modules/<name>/`.
- Files:
  - `<name>.model.ts` (schema),
  - `<name>.types.ts` (interfaces/enums),
  - `<name>.service.ts` (logic/DB),
  - `<name>.controller.ts` (thin),
  - `<name>.routes.ts` (router).
- Controllers: wrap with `asyncHandler`; respond via `response(res, data, status)`; throw `createError` (or error with `status`/`statusCode`) for failures.
- Routes: mount in `v1Router`; attach per-route middleware (auth, validation, uploads) before handlers.
- Models: co-locate schemas; import types from `.types.ts`; add indexes in `dbIndexes` when needed.

## API responses

- Standard shape: `{ status, success, data }` from `src/utils/responses.ts`; `success` auto-true for 2xx/3xx.
- Use `response` for JSON; `okHtml`/`okFile`/`okRaw` for other payloads.
- Map errors to 4xx/5xx via `createError`; let `errorHandler` format.
- Status norms: `201` create, `204` delete, `400` validation, `401/403` auth/authz, `404` missing, `409` conflict, `413` too large.

## Middleware

- Shared: `src/middlewares/` → `requestLogger`, `errorHandler`, `notFound`/`unsupportedRoute`.
- Module-specific middleware should live in the module’s routes unless truly global.

## Utils

- Reuse helpers in `src/utils/`: `asyncHandler`, `responses`, `error`, `logger`, `static`, token/cookie helpers, etc. Avoid custom one-offs.

## Services and integrations

- Shared service initializers go in `src/service/` (mailers, schedulers, external clients). Feature-flag them and init from `core/app` or module services.
- Document new integrations under `ai_instructions/`.

## Types

- **Strict Typing**: Use strict TypeScript. Avoid `any` or `as any` casts.
- **Organization**:
  - Global types: `src/types/`.
  - Module types: `src/modules/<module>/<module>.types.ts`.
- **Express**: `req.user` is typed globally in `src/types/express/index.d.ts`. Use it instead of local casts.

## Auth flow (Keycloak)

- Authentication is managed via Keycloak.
- Backend API is stateless and expects a valid Bearer Access Token in the `Authorization` header.
- `src/middlewares/auth.middleware.ts` uses `jwks-rsa` to verify the JWT signature against Keycloak's public keys.
- `KEYCLOAK_*` env vars configure the integration.
- The `authenticate` middleware populates `req.user` with the decoded token + local user details (if found by `keycloakId` or `email`).
- RBAC is handled via `req.user.realm_access.roles`.
- Errors: `401` invalid/expired token, `403` forbidden role.

## Logging and errors

- Use `logger` (pino); avoid `console.*`.
- Throw errors with HTTP status; `errorHandler` shapes responses.

## Tests and quality

- Tests live in `src/tests/` (light today). At minimum, hit endpoints manually.
- **Linting**: Run `npm run lint` before merging. Ensure zero lint errors.
- **Type Check**: Run `npx tsc --noEmit` to verify type safety.

## Assets and static files

- Static assets: `src/assets/`; `welcomeRoute` uses `okFile`/`okHtml`.
- Uploads/generated files: keep outside `src/` (e.g., `uploads/`) and ignore in VCS.

## Documentation

- `backend/resource.md`: List of global available function, middleware, constants, assets.
- If you update/add/delete any global resource, you MUST update `backend/resource.md`.
