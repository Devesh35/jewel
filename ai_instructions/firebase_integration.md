# Firebase integration guide

## Setup

- `src/service/firebase.ts`: feature-flagged initializer for Firebase Admin SDK; supports credentials from a `serviceAccount.json` file or env vars.
- `src/core/app.ts`: calls `initFirebase()` during bootstrap.
- `env.ts` and `env.example`: define Firebase-related env vars and the `ENABLE_FIREBASE` feature flag.

### Init function (reference)

```ts
// src/service/firebase.ts
export const initFirebase = () => {
  if (!env.ENABLE_FIREBASE) return null;

  try {
    logger.info("Firebase enabled; initializing Admin SDK");
    if (admin.apps.length) return admin.app();

    const serviceAccountPath = path.join(process.cwd(), "serviceAccount.json");
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(
        fs.readFileSync(serviceAccountPath, "utf8")
      );
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    if (
      env.FIREBASE_PROJECT_ID &&
      env.FIREBASE_CLIENT_EMAIL &&
      env.FIREBASE_PRIVATE_KEY
    ) {
      return admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
    }

    logger.warn("Firebase credentials not provided; FCM disabled");
    return null;
  } catch (err) {
    logger.error({ err }, "Failed to initialize Firebase Admin");
    return null;
  }
};
```

## Dependencies to install

```bash
npm install firebase-admin
```

## Environment flags/values

- `ENABLE_FIREBASE` (boolean): feature flag; skips initialization when false.
- `FIREBASE_PROJECT_ID` (string, optional): project ID for env-based creds.
- `FIREBASE_CLIENT_EMAIL` (string, optional): client email for env-based creds.
- `FIREBASE_PRIVATE_KEY` (string, optional): private key; store with escaped newlines (`\n`) and the initializer will convert them.

Example `.env` entries:

```
ENABLE_FIREBASE=true
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nABC...\n-----END PRIVATE KEY-----\n"
```

### Alternative credential file

- If a `serviceAccount.json` exists at the project root (`process.cwd()`), it is loaded instead of env-based creds.
- Do **not** commit this file; keep it outside version control.

## How to transplant the setup

1. **Add env handling**

   - Add the vars above to your config schema and `.env.example`.
   - Keep `ENABLE_FIREBASE` as a feature flag to disable Firebase in local/test environments.

2. **Bring over the initializer**

   - Copy `src/service/firebase.ts` and update logger imports if needed.
   - The initializer:
     - No-ops if the feature flag is off.
     - If an app already exists, returns it.
     - Prefers `serviceAccount.json` when present.
     - Otherwise, initializes with env-based credentials, replacing `\\n` in the private key.
     - Logs a warning and returns `null` if creds are missing.

3. **Wire into bootstrap**

   - After creating your Express app (and any other service init), call `initFirebase()`. No explicit shutdown hook is required for Admin SDK by default.

4. **Use in your code**

   - Access the initialized app via `admin.app()` or `admin.apps[0]` after calling `initFirebase()`.
   - Add helpers for FCM messaging, auth, storage, etc., as needed.

## Minimal bootstrap example

```ts
import { initFirebase } from "./service/firebase";

// after app creation
initFirebase();
```

## Notes and gotchas

- Keep private keys out of the repo; use environment variables or external secret stores.
- When using env-based private keys, ensure the value uses escaped newlines (`\n`); the initializer unescapes them.
- If running in serverless environments, prefer env-based creds over filesystem reads.
