# SMTP email integration guide

## Setup

- `src/service/smtpMailer.ts`: initializes a singleton Nodemailer transporter when `ENABLE_EMAIL` is true and `EMAIL_USER`/`EMAIL_PASS` are provided; logs and skips otherwise. Exposes `initMailer()` and `getMailerStatus()`.
- `src/core/app.ts`: calls `initMailer()` during app bootstrap after Mongo is connected.
- `src/modules/health/health.service.ts`: reports mailer availability via `getMailerStatus()`.
- `env.ts` and `env.example`: define and document all SMTP-related environment variables.

## Dependencies to install

```bash
npm install nodemailer
```

## Environment flags/values

- `ENABLE_EMAIL` (boolean): feature flag; when false, mailer is skipped.
- `EMAIL_HOST` (string, default `smtp.gmail.com`): SMTP host.
- `EMAIL_PORT` (number, default `587`): SMTP port.
- `EMAIL_SECURE` (boolean, default `false`): set `true` for TLS/465, `false` for STARTTLS/587.
- `EMAIL_USER` (string, required when enabled): SMTP username.
- `EMAIL_PASS` (string, required when enabled): SMTP password (or provider-specific app password).
- `EMAIL_FROM` (string, optional): default from address you can apply when sending.

## How to transplant the setup

1. **Add env handling**

   - In your config layer, add the variables above with sane defaults (see `env.ts`) and surface `ENABLE_EMAIL` as a feature flag.
   - Update your `.env.example` to document them.

2. **Bring over the mailer service**

   - Copy `src/service/smtpMailer.ts` (or recreate it) and adjust imports for your logger/utilities.
   - Pattern: if `ENABLE_EMAIL` is false or credentials are missing, log and return `null`; otherwise, build the transporter with `{ host, port, secure, auth: { user, pass } }`.

3. **Wire into app bootstrap**

   - After your app is created and configuration is loaded (and after Mongo/connectors if you need them), call `initMailer()`.
   - On health/readiness endpoints, you can reuse `getMailerStatus()` to report availability when email is enabled.

4. **Sending mail (example helper)**  
   The current codebase only initializes the transporter; add a small helper alongside it if you need to send mail:

```ts
import nodemailer from "nodemailer";
import { env } from "../config/env";
import { logger } from "../utils/logger";

let transporter: nodemailer.Transporter | null = null;

export const initMailer = () => {
  if (!env.ENABLE_EMAIL) return null;
  if (!env.EMAIL_USER || !env.EMAIL_PASS) {
    logger.warn("Email credentials missing; mailer disabled");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    secure: env.EMAIL_SECURE,
    auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASS },
  });

  return transporter;
};

export const sendEmail = async (options: {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}) => {
  if (!transporter) throw new Error("Mailer not initialized");
  const from = options.from ?? env.EMAIL_FROM ?? env.EMAIL_USER;
  return transporter.sendMail({ ...options, from });
};
```

5. **Minimal bootstrap example**

```ts
// After creating `app` and connecting other services
initMailer();

process.on("SIGINT", async () => {
  // nothing to close for nodemailer by default
  process.exit(0);
});
```

## Notes and gotchas

- Use provider-approved app passwords (e.g., Gmail) instead of raw credentials.
- Set `EMAIL_SECURE=true` when using port 465; keep it `false` for STARTTLS ports like 587.
- Keep `ENABLE_EMAIL` off in local/test environments where SMTP creds are absent.
- `getMailerStatus()` only reports transporter creation; consider a startup test send if you need deeper assurance.
