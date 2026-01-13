# S3 upload guide (from routes)

## Purpose
How to accept files in Express routes and upload them to Amazon S3 while following the backend module pattern (`*.model.ts`, `*.service.ts`, `*.controller.ts`, `*.routes.ts`) and shared helpers (`asyncHandler`, `response`, `createError`).

## Dependencies to install
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer
npm install -D @types/multer
```

## Required/optional env vars (add to `src/config/env.ts` and `.env.example`)
- `ENABLE_S3_UPLOAD` (boolean feature flag).
- `AWS_REGION` (string).
- `AWS_ACCESS_KEY_ID` (string).
- `AWS_SECRET_ACCESS_KEY` (string).
- `S3_BUCKET` (string): target bucket name.
- `S3_UPLOAD_PREFIX` (string, optional): key prefix/folder, e.g., `uploads/`.
- `UPLOAD_MAX_FILE_SIZE` (number, optional): per-file byte cap (e.g., `5242880` for 5 MB).
- `UPLOAD_ALLOWED_MIME` (CSV, optional): e.g., `image/jpeg,image/png,application/pdf`.

## Steps to add the module
1. Scaffold files under `src/modules/<name>/`
   - `<name>.model.ts`: optional metadata schema (key, originalName, mimeType, size, url, createdAt, ownerId).
   - `<name>.service.ts`: create an S3 client, build object keys, upload streams/buffers, and persist metadata.
   - `<name>.controller.ts`: validate request, ensure `req.file`/`req.files` exists, call service, respond with `response(res, data, 201|200)`, and throw `createError` on validation failures.
   - `<name>.routes.ts`: attach multer middleware and expose endpoints (e.g., `POST /upload`).
2. Multer configuration
   - Use memory storage for direct S3 uploads: `multer({ storage: multer.memoryStorage(), limits: { fileSize: env.UPLOAD_MAX_FILE_SIZE } })`.
   - Validate MIME types via `fileFilter`; reject unsupported types with `createError(415, "Unsupported file type")`.
   - Avoid trusting `originalname`; generate safe keys in the service layer.
3. S3 client and upload
   - Initialize `S3Client` with `region` and credentials from env; consider letting AWS default provider chain resolve credentials in production.
   - Build keys as `${prefix}${uuid}${ext}` to avoid collisions and path traversal.
   - Set `ContentType` from the uploaded MIME; set `CacheControl` if needed.
   - Keep objects private by default; avoid ACLs unless required.
   - For large files, prefer streaming (`Body: Readable`); for typical form uploads, `req.file.buffer` works.
4. Routing
   - Mount the module in `src/routing/v1.ts` with `v1Router.use("/<path>", <name>Routes);`.
   - Keep uploads under `/api/v1/...`; guard with auth if needed.
5. Error handling and responses
   - Wrap controllers with `asyncHandler`.
   - Map size limit errors (`LIMIT_FILE_SIZE`) to HTTP 413.
   - On S3 failures, log the error and throw `createError(502, "Upload failed")`.
   - Return JSON via `response(res, { key, url? }, 201)`; do not return raw S3 errors to clients.
6. Security and hygiene
   - Validate MIME and size; never use user-controlled paths in S3 keys.
   - Strip/limit metadata you persist; avoid echoing credentials.
   - If you expose public URLs, prefer signed URLs instead of `public-read` ACL.
7. Cleanup
   - If you persist metadata in DB, ensure deletes remove both DB record and S3 object.
   - Consider lifecycle rules in S3 for temp uploads.

## Minimal template (pattern)
```ts
// src/modules/uploads/uploads.routes.ts
import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../../utils/asyncHandler";
import { response } from "../../utils/responses";
import { createError } from "../../utils/error";
import { uploadToS3 } from "./uploads.service";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // replace with env.UPLOAD_MAX_FILE_SIZE
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
  "/upload",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw createError(400, "File is required");
    const result = await uploadToS3(req.file);
    response(res, result, 201);
  })
);
```

```ts
// src/modules/uploads/uploads.service.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import path from "path";
import { env } from "../../config/env";

const s3 = new S3Client({ region: env.AWS_REGION });
const prefix = env.S3_UPLOAD_PREFIX ?? "";

export const uploadToS3 = async (file: Express.Multer.File) => {
  if (!env.ENABLE_S3_UPLOAD) throw new Error("S3 upload disabled");

  const ext = path.extname(file.originalname);
  const key = `${prefix}${crypto.randomUUID()}${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  return { key };
};
```

## Definition of done checklist
- Feature flag and env vars added to `src/config/env.ts` and `.env.example`.
- Module files created (model/service/controller/routes) and mounted in `v1Router`.
- Multer uses memory storage with size/MIME validation; controllers wrapped with `asyncHandler`.
- S3 keys generated safely; objects uploaded with correct `ContentType`; no public ACL unless intentional.
- Errors mapped to appropriate HTTP codes; responses use `response`.
- Optional: metadata stored and delete path implemented to remove both DB records and S3 objects.

