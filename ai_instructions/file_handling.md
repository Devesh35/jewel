# File handling (uploads) guide

## Purpose
How to add file handling from Express routes while following the existing module pattern (`*.model.ts`, `*.service.ts`, `*.controller.ts`, `*.routes.ts`) and shared helpers (`asyncHandler`, `response`, `createError`).

## Dependencies to install
```bash
npm install multer
npm install -D @types/multer
```

## Recommended defaults and env flags (add if needed)
- `UPLOAD_MAX_FILE_SIZE` (bytes): cap per-file size (e.g., `5242880` for 5 MB).
- `UPLOAD_ALLOWED_MIME` (CSV): e.g., `image/jpeg,image/png,application/pdf`.
- `UPLOAD_STORAGE_DIR`: absolute or relative path for disk storage (e.g., `./uploads`). Create directories on startup.
Add these to `src/config/env.ts` (Zod schema) and mirror them in `.env.example` when you introduce them.

## Steps to add file handling in a new module
1. Scaffold module
   - `src/modules/<name>/<name>.model.ts`: optional metadata model (e.g., filename, size, mimeType, path, ownerId, createdAt).
   - `src/modules/<name>/<name>.service.ts`: persist metadata, generate file IDs, and handle cleanup. Keep file-system logic here, not in controllers.
   - `src/modules/<name>/<name>.controller.ts`: validate request, ensure a file exists (`req.file`/`req.files`), call service, respond with `response(res, data, 201|200)`, and throw `createError(400, "message")` on validation errors.
   - `src/modules/<name>/<name>.routes.ts`: define the router and attach multer middleware to specific endpoints (e.g., `upload.single("file")`).
2. Configure multer per route
   - Use `multer({ storage, limits: { fileSize: env.UPLOAD_MAX_FILE_SIZE } })`.
   - Prefer disk storage with a deterministic directory from `env.UPLOAD_STORAGE_DIR`; ensure the directory exists before first upload.
   - Validate MIME types in a `fileFilter` and reject unknown types with a clear error.
   - Avoid storing untrusted original filenames; generate safe names (e.g., UUID + extension) in the service/storage layer.
3. Register routes
   - Mount in `src/routing/v1.ts` via `v1Router.use("/<path>", <name>Routes);`. Keep uploads behind `/api/v1/...`.
   - For downloads, reuse `okFile(res, absolutePath)` or stream and set `Content-Type` explicitly.
4. Error handling and responses
   - Wrap controllers with `asyncHandler` so multer/file errors propagate to `errorHandler`.
   - Convert common failures to typed errors: missing file, invalid MIME, size exceeded (map multer's `LIMIT_FILE_SIZE` to `413 Payload Too Large`), storage failures.
   - Use `response(res, data, status)` for JSON; prefer `201` for successful creates/uploads.
5. Security and hygiene
   - Enforce MIME/type checks and size limits; never trust `originalname` for paths.
   - Store files outside `src/` if they should not be bundled; consider `uploads/` at repo root and ignore it in VCS.
   - If exposing public downloads, serve via `okFile`/stream and guard with auth/authorization as required.
   - Sanitize user input used in paths; block `..` or absolute paths.
6. Cleanup and lifecycle
   - If a DB record is created for each file, ensure deletes remove both DB metadata and the physical file.
   - For temp files or memory storage, ensure you persist or discard promptly to avoid leaks.

## Minimal template (pattern)
```ts
// src/modules/uploads/uploads.routes.ts
import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { asyncHandler } from "../../utils/asyncHandler";
import { response } from "../../utils/responses";
import { createError } from "../../utils/error";

const uploadsDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const safeName = crypto.randomUUID() + ext;
      cb(null, safeName);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB default; replace with env
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowed.includes(file.mimetype)) {
      return cb(createError(415, "Unsupported file type"));
    }
    cb(null, true);
  },
});

export const uploadsRoutes = Router();

uploadsRoutes.post(
  "/",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw createError(400, "File is required");
    // TODO: call service to persist metadata; return its result
    response(res, { id: req.file.filename, size: req.file.size }, 201);
  })
);
```

## Definition of done checklist
- Multer configured per route with size and MIME validation.
- Safe filenames generated; upload directory ensured to exist.
- Controllers wrapped with `asyncHandler`; errors mapped to `createError` with meaningful status codes.
- Responses use `response`; routes mounted in `v1Router`.
- Any new env vars added to `src/config/env.ts` and `.env.example`; optional feature flags wired.
- Upload/delete flows clean up both metadata and physical files.

