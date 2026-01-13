# WhatsApp integration guide

## Setup

- `src/service/whatsapp.ts`: feature-flagged stub initializer; logs when WhatsApp is enabled and returns a placeholder client.
- `src/modules/whatsapp/whatsapp.service.ts`: webhook verification helper comparing Meta’s verify token.
- `src/modules/whatsapp/whatsapp.controller.ts`: GET handler that responds with the challenge when verification succeeds.
- `src/modules/whatsapp/whatsapp.routes.ts`: exposes `GET /register` for webhook verification.
- `src/routing/v1.ts`: mounts the module at `/api/v1/whatsapp`.
- `src/core/app.ts`: calls `initWhatsApp()` during bootstrap.

### Register route (reference)

```ts
// src/modules/whatsapp/whatsapp.routes.ts
const router = Router();
router.get("/register", asyncHandler(registerWhatsApp));
export default router;
```

Mounted under `/api/v1/whatsapp`, the webhook verify URL is:

- `GET /api/v1/whatsapp/register?hub.mode=subscribe&hub.verify_token=<token>&hub.challenge=<challenge>`

## Dependencies to install

None in this stub implementation. Add your chosen WhatsApp Business/Cloud SDK when you wire real sending/receiving logic.

## Environment flags/values

- `ENABLE_WHATSAPP` (boolean): feature flag; skip initialization when false.
- `WHATSAPP_TOKEN` (string, optional): placeholder for client auth (not used in the stub).
- `WHATSAPP_PHONE_NUMBER_ID` (string, optional): placeholder for Cloud API messaging.
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN` (string, required for webhook verify): must match the token configured in Meta’s webhook settings.
- `WHATSAPP_MAX_RETRIES` (number, default `3`): available for retry strategies (not used in the stub).
- `WHATSAPP_RETRY_BASE_MS` (number, default `500`): base delay for retries (not used in the stub).

## How to transplant the setup

1. **Add env handling**

   - Mirror the vars above in your config schema and `.env.example`.
   - Keep `ENABLE_WHATSAPP` as a feature flag so local/test runs can disable the webhook.

2. **Bring over the service stub**

   - Copy `src/service/whatsapp.ts` and adjust logger imports.
   - Replace the stubbed return with your actual WhatsApp client initialization using `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, and retry settings if needed.

3. **Webhook verification endpoint**

   - Copy `src/modules/whatsapp/whatsapp.service.ts`, `.controller.ts`, and `.routes.ts`.
   - The controller handles `GET /api/v1/whatsapp/register?hub.mode=subscribe&hub.verify_token=<token>&hub.challenge=<challenge>` and echoes the `hub.challenge` when `hub.verify_token` matches `WHATSAPP_WEBHOOK_VERIFY_TOKEN`; otherwise returns 403.

4. **Wire into routing**

   - Mount the routes under your API prefix (e.g., `/api/v1/whatsapp`) similar to `src/routing/v1.ts`.

5. **Bootstrap**

   - After creating the app (and after any required config loading), call `initWhatsApp()`. It no-ops when the flag is off.

6. **Extend for real messaging**

   - Add handlers for POST webhooks to receive messages.
   - Implement send-message helpers that call the WhatsApp Cloud API using `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_TOKEN`.

## Minimal webhook verify handler (pattern)

```ts
export const registerWhatsApp = async (req: Request, res: Response) => {
  const mode = req.query["hub.mode"] as string;
  const token = req.query["hub.verify_token"] as string;
  const challenge = req.query["hub.challenge"] as string;

  if (mode === "subscribe" && token === env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.status(403).json({ status: 403, message: "Unauthorized" });
};
```

## Notes and gotchas

- Keep the verify endpoint accessible publicly so Meta can reach it; secure it only via the verify token.
- Store `WHATSAPP_WEBHOOK_VERIFY_TOKEN` securely; rotate it together with Meta’s webhook config.
- When adding a real client, handle signature verification and message processing per WhatsApp Cloud API docs.
