import "./loadEnv";

import { z } from "zod";

const bool = z.union([z.string(), z.number(), z.boolean()]).transform((val) => {
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val === 1;
  const lower = val.toLowerCase();
  return lower === "true" || lower === "1";
});

const csv = z
  .string()
  .trim()
  .transform((value) =>
    value
      ? value
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean)
      : []
  );

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "staging"])
    .default("development"),
  PORT: z.coerce.number().default(5000),
  BACKEND_URL: z.string().url().optional(),
  TRUST_PROXY: z.union([z.string(), z.number(), z.boolean()]).default("1"),

  ENABLE_MORGAN_LOGS: bool.optional(),
  ENABLE_RATE_LIMIT: bool.default(false),

  MONGODB_URI: z.string(),
  MONGODB_MAX_POOL_SIZE: z.coerce.number().default(100),
  MONGODB_MIN_POOL_SIZE: z.coerce.number().default(10),
  MONGODB_SERVER_SELECTION_TIMEOUT_MS: z.coerce.number().default(30000),
  MONGODB_WAIT_QUEUE_TIMEOUT_MS: z.coerce.number().default(30000),
  MONGODB_SOCKET_TIMEOUT_MS: z.coerce.number().default(45000),
  MONGODB_CONNECT_TIMEOUT_MS: z.coerce.number().default(10000),
  MONGODB_MAX_IDLE_TIME_MS: z.coerce.number().default(60000),
  MONGODB_AUTO_INDEX: bool.default(false),

  CORS_ALLOWED_ORIGINS: csv.default([]),
  CORS_ALLOWED_REGEX: csv.default([]),
  CORS_ALLOW_NO_ORIGIN: bool.default(false),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),

  INTERNAL_HMAC_SECRET: z.string().optional(),

  // Keycloak
  KEYCLOAK_JWKS_URI: z.string().url(),
  KEYCLOAK_ISSUER: z.string().url(),
  KEYCLOAK_AUDIENCE: z.string().optional(), // Audience check is good practice
});

export type AppEnv = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);

export const appConfig = {
  env,
  isProduction: env.NODE_ENV === "production",
  isStaging: env.NODE_ENV === "staging",
  baseUrl: env.BACKEND_URL || `http://localhost:${env.PORT}`,
  features: {
    rateLimit: env.ENABLE_RATE_LIMIT,
  },
};
