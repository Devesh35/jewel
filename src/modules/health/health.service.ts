import mongoose from "mongoose";

import packageJson from "../../../package.json";
import { env } from "../../config/env";

type HealthStatus = {
  status: "ok";
  timestamp: string;
  uptime: number;
  env: string;
  version: string;
  db: {
    state: string;
  };
  memory: ReturnType<typeof process.memoryUsage>;
};

export const getHealthStatus = async (): Promise<HealthStatus> => {
  const dbState = mongoose.connection.readyState;
  const dbStateMap: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: env.NODE_ENV,
    version: packageJson.version,
    db: { state: dbStateMap[dbState] ?? "unknown" },
    memory: process.memoryUsage(),
  };
};

export const getReadiness = async () => {
  const status = await getHealthStatus();
  const isReady = status.db.state === "connected";

  return { ready: isReady, ...status };
};

export const getLiveness = () => ({
  live: true,
  timestamp: new Date().toISOString(),
});
