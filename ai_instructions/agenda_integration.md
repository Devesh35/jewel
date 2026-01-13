# Agenda integration guide

## Setup

- `src/agenda/agenda.ts`: lazy Agenda bootstrap that uses MongoDB, sets default concurrency, registers jobs, and optionally exposes the Agendash UI at `/dash` protected by a bearer token.
- `src/agenda/jobs/index.ts`: job registrar list; add new registrars here so they are loaded automatically.
- `src/agenda/jobs/healthCheck.ts`: example recurring job (`health-check`) that logs the service health every hour.
- `src/types/agendash.d.ts`: minimal type stub so `agendash` works with TypeScript.

### Module declaration (TypeScript)

If your target codebase lacks typings for Agendash, add a stub:

```ts
// src/types/agendash.d.ts
declare module "agendash";
```

## Dependencies to install

```bash
npm install agenda agendash
```

Agenda requires a MongoDB instance (connection string provided via env).

## Environment flags/values

- `ENABLE_AGENDA` (boolean): feature flag; when false, scheduling is skipped.
- `MONGODB_URI` (string, required when Agenda is enabled): Mongo connection string; a dedicated `agendaJobs` collection is created automatically.
- `JOB_CONCURRENCY` (number, default `2`): Agenda `defaultConcurrency`.
- `AGENDASH_TOKEN` (string, optional): bearer token required to access the dashboard at `/dash`. If absent, the dashboard is not mounted.

## How to transplant the setup

1. **Bring over the scheduler module**  
   Copy `src/agenda/agenda.ts` (or recreate it) and adjust imports for your logger/response helpers. The flow is:

   - Bail out early when `ENABLE_AGENDA` is false or `MONGODB_URI` is missing.
   - Create the Agenda instance with `{ db: { address: MONGODB_URI, collection: "agendaJobs" }, defaultConcurrency: JOB_CONCURRENCY }`.
   - `await agenda.start()` then call `registerJobs(agenda)`.
   - If `AGENDASH_TOKEN` is present, mount `agendash` at `/dash` with a simple bearer check; otherwise skip the dashboard.
   - Export `initAgenda(app: Express)` and `stopAgenda()` so the lifecycle can be controlled from your bootstrap/shutdown paths.

2. **Job registration pattern**  
   Reuse `src/agenda/jobs/index.ts`: maintain an array of registrar functions and loop through them inside `registerJobs`. Add each new job registrar to that array so jobs are discoverable and registered once.

3. **Define jobs**  
   Follow the pattern in `src/agenda/jobs/healthCheck.ts`: define the job, then schedule it (e.g., `agenda.every("1 hour", JOB_NAME)`). Swap out the body for whatever your service needs.

4. **Wire into app bootstrap**

   - After your Express app is created and Mongo is connected, run `await initAgenda(app)`.
   - On shutdown (SIGINT/SIGTERM), call `await stopAgenda()` before closing Mongo to let Agenda persist state cleanly.

5. **Enable the dashboard (optional)**
   - Set `AGENDASH_TOKEN` to any secret value.
   - Access `GET /dash` with header `Authorization: Bearer <AGENDASH_TOKEN>`. The middleware rejects other requests.

## Minimal bootstrap example

```ts
// After creating `app` and connecting to Mongo
await initAgenda(app);

process.on("SIGINT", async () => {
  await stopAgenda();
  await disconnectMongo();
  process.exit(0);
});
```

## Notes and gotchas

- Keep `ENABLE_AGENDA` off for tests/local runs where Mongo is unavailable.
- If you rename the dashboard path, update any monitoring/firewall rules accordingly.
- Agenda opens its own Mongo client; ensure the URI points at a reachable replica set/standalone node.
