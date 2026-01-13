import cors, { type CorsOptions } from "cors";
import express, { type Express } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

import { appConfig, env } from "../config/env";
import { requestLogger } from "../middlewares/requestLogger";
import { logger } from "../utils/logger";
import { response } from "../utils/responses";

const buildCorsOptions = (): CorsOptions => {
  const allowNoOrigin = env.CORS_ALLOW_NO_ORIGIN;
  const allowedOrigins = env.CORS_ALLOWED_ORIGINS;
  const allowedRegex = env.CORS_ALLOWED_REGEX.map(
    (pattern) => new RegExp(pattern)
  );

  const origin: CorsOptions["origin"] = (originValue, callback) => {
    if (!originValue && allowNoOrigin) {
      return callback(null, true);
    }

    const isAllowed =
      !!originValue &&
      (allowedOrigins.includes(originValue) ||
        allowedRegex.some((regex) => regex.test(originValue)));

    if (isAllowed) {
      return callback(null, true);
    }

    return callback(new Error("Origin not allowed by CORS"));
  };

  return {
    origin,
    credentials: true,
  };
};

export const setupPlugins = (app: Express) => {
  app.set("trust proxy", env.TRUST_PROXY as any);

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          "script-src": ["'self'", "'unsafe-inline'"],
          "frame-src": ["'self'"],
        },
      },
    })
  );

  app.use(cors(buildCorsOptions()));

  if (env.ENABLE_RATE_LIMIT) {
    logger.info("Rate limiting enabled");
    app.use(
      rateLimit({
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        limit: env.RATE_LIMIT_MAX_REQUESTS,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (_req, res) =>
          response(res, { message: "Too many requests" }, 429),
      })
    );
  }

  if (env.ENABLE_MORGAN_LOGS || !appConfig.isProduction) {
    if (env.ENABLE_MORGAN_LOGS) {
      logger.info("Request logging enabled via feature flag");
    }
    app.use(requestLogger());
  }

  app.use(
    express.json({
      limit: "10mb",
    })
  );
  app.use(
    express.urlencoded({
      limit: "10mb",
      extended: true,
    })
  );

  app.set("query parser", "simple");
};
