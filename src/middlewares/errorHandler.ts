import { logger } from "../utils/logger";
import { response } from "../utils/responses";

import type { NextFunction, Request, Response } from "express";

type ErrorWithStatus = {
  status?: number;
  statusCode?: number;
  message?: string;
};

const resolveStatus = (err: ErrorWithStatus): number => {
  const status = err.status ?? err.statusCode;
  if (typeof status === "number" && status >= 400 && status < 600) {
    return status;
  }
  return 500;
};

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const errorLike = (err ?? {}) as ErrorWithStatus;
  const status = resolveStatus(errorLike);
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "string"
      ? err
      : "Internal server error";

  logger.error(
    {
      err,
      status,
      stack: err instanceof Error ? err.stack : undefined,
    },
    "Request failed"
  );

  response(
    res,
    {
      message,
    },
    status
  );
};
