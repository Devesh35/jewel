# Backend

TypeScript Express API with MongoDB, health checks, and basic middleware setup (logging, CORS, security headers, optional rate limiting).

## Requirements

- Node.js 20+
- MongoDB instance (URI in `.env`)

## Setup

1. Create env file(s): copy `env.example` to `.env` for shared defaults. For environment overrides, create `.env.development`, `.env.staging`, or `.env.production`. The loader picks `.env.<NODE_ENV>` when present, falling back to `.env`; values in `.env` act as defaults.
2. Install packages: `npm install`
3. Start in dev mode: `npm run dev` (runs on the configured `PORT`, default 5000).
4. Production build: `npm run build` then `npm start`.

## Environment files

- `NODE_ENV` controls which file is loaded (`development` default).
- Precedence: `.env.<NODE_ENV>` overrides `.env`; `.env` is used alone if the specific file is missing.
- `process.env.LOADED_ENV_FILE` is set at runtime to the file name that was applied.
- Env files are gitignored via `.env` and `.env.*`.

## Useful scripts

- `npm run dev` — run with hot reload via ts-node-dev.
- `npm run lint` / `npm run lint:fix` — ESLint checks.
- `npm run spellcheck` — cspell over code and docs.
- `npm run test` — placeholder.

## API surface

- `GET /` — static welcome page.
- `GET /api/v1/health` — service + DB health details.
- `GET /api/v1/health/ready` — readiness probe.
- `GET /api/v1/health/live` — liveness probe.

## Notes

- Logging uses Pino; request logging via Morgan can be toggled with `ENABLE_MORGAN_LOGS=true`.
- Rate limiting can be enabled with `ENABLE_RATE_LIMIT=true` (window and limit values in `.env`).
- `TRUST_PROXY` defaults to `1`; adjust if running behind a different proxy chain.
