# Backend module creation guide

## Baseline architecture

- Express + TypeScript entrypoint (`src/index.ts`) creates the app, applies plugins (`setupPlugins`), mounts `rootRouter`, connects Mongo, and wires global error handling.
- API routes live under `/api` → `src/routing/apiRouter.ts` → `src/routing/v1.ts`.
- Modules sit in `src/modules/<moduleName>/` and typically split into `*.model.ts`, `*.service.ts`, `*.controller.ts`, and `*.routes.ts`. Controllers are wrapped with `asyncHandler` and respond via `response`.

## Steps to add a new module

1. Scaffold the module folder
   - Create `src/modules/<name>/<name>.model.ts` for Mongoose schemas/models or other data-layer definitions the service will use.
   - Create `src/modules/<name>/<name>.service.ts` for business logic and database access. Keep controllers thin. If you add Mongo collections or indexes, extend `src/core/dbIndexes.ts` to seed indexes on startup.
   - Create `src/modules/<name>/<name>.controller.ts` that imports service functions, wraps each handler with `asyncHandler`, and returns JSON with `response(res, data, status)`.
   - Create `src/modules/<name>/<name>.routes.ts` exporting a `Router` instance that wires HTTP verbs to controller handlers.
2. Register routing
   - Mount the module in `src/routing/v1.ts` (or another version router) with `v1Router.use("/<path>", <name>Routes);`. This makes the module available under `/api/v1/<path>`.
   - Only add routes to `rootRouter` when they are public/non-API (rare; see `welcomeRoute`).
3. Responses and errors
   - Prefer `response(res, data, status)` for JSON. Use `okHtml`/`okFile`/`okRaw` when sending HTML/files/raw data.
   - For failures, throw `createError(status, message)` (or any error object with a `status`/`statusCode`) so `errorHandler` formats the response. Avoid `res.json` directly in controllers.
   - Wrap every async controller with `asyncHandler` so rejections reach the global `errorHandler`.
4. Configuration and env vars
   - Add new variables to the Zod schema in `src/config/env.ts` with sensible defaults. Mirror them in `.env.example` with placeholder values.
   - Use feature flags (`ENABLE_<FEATURE>`) for optional modules so local/test runs can disable them cleanly.
5. Validation and typing
   - Validate inputs close to the controller (zod is already in use for env validation). Define request/response types or DTOs near the controller/service or under `src/types` for reuse.
6. Logging and observability
   - Use `logger` for structured logs; avoid `console.*`. Include contextual fields (e.g., userId, params) when helpful.
   - Keep request logging to the existing `requestLogger` middleware; add module-specific logs only where they add value.
7. Middleware and security
   - Reuse global middleware (helmet, CORS, rate limit, body parsers). If a module needs extra middleware (auth, validation), register it in its `*.routes.ts` before the handlers.
8. Tests and checks
   - Add or update tests under `src/tests/` when possible. At minimum, hit the new endpoints locally.
   - Run `npm run lint` to keep formatting and imports clean.

## Minimal template (copy/paste)

```ts
// src/modules/foo/foo.model.ts
// export const FooModel = mongoose.model("Foo", FooSchema);
// keep schemas/models alongside the module for cohesion

// src/modules/foo/foo.service.ts
export const listFoos = async () => {
  // business logic / DB calls
  return [{ id: 1, name: "example" }];
};

// src/modules/foo/foo.controller.ts
import { asyncHandler } from "../../utils/asyncHandler";
import { response } from "../../utils/responses";
import { listFoos } from "./foo.service";

export const getFoos = asyncHandler(async (_req, res) => {
  const data = await listFoos();
  response(res, data, 200);
});

// src/modules/foo/foo.routes.ts
import { Router } from "express";
import { getFoos } from "./foo.controller";

export const fooRoutes = Router();
fooRoutes.get("/", getFoos);

// src/routing/v1.ts
import { fooRoutes } from "../modules/foo/foo.routes";
v1Router.use("/foo", fooRoutes);
```

## Definition of done checklist

- Module folder created with service, controller, routes files and exports.
- Routes mounted in the appropriate versioned router (`v1Router` today).
- Responses use `response` helpers; errors throw `createError`/status-bearing errors; controllers wrapped with `asyncHandler`.
- Any new env vars added to `src/config/env.ts` and `.env.example`; optional modules guarded by feature flags.
- Mongo indexes (if needed) registered via `src/core/dbIndexes.ts`.
- Lint passes (`npm run lint`) and endpoints manually verified.
