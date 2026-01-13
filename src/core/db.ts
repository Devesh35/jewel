import mongoose from "mongoose";

import { env } from "../config/env";
import { logger } from "../utils/logger";

import { seedIndexes } from "./dbIndexes";

let mongoConnection: typeof mongoose | null = null;

export const connectMongo = async () => {
  if (mongoConnection) {
    return mongoConnection;
  }

  if (!env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required but not set");
  }

  mongoConnection = await mongoose.connect(env.MONGODB_URI, {
    maxPoolSize: env.MONGODB_MAX_POOL_SIZE,
    minPoolSize: env.MONGODB_MIN_POOL_SIZE,
    serverSelectionTimeoutMS: env.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
    waitQueueTimeoutMS: env.MONGODB_WAIT_QUEUE_TIMEOUT_MS,
    socketTimeoutMS: env.MONGODB_SOCKET_TIMEOUT_MS,
    connectTimeoutMS: env.MONGODB_CONNECT_TIMEOUT_MS,
    maxIdleTimeMS: env.MONGODB_MAX_IDLE_TIME_MS,
    autoIndex: env.MONGODB_AUTO_INDEX,
  });

  await seedIndexes(mongoConnection.connection);
  logger.info("Connected to MongoDB");
  return mongoConnection;
};

export const disconnectMongo = async () => {
  if (!mongoConnection) return;
  await mongoConnection.disconnect();
  mongoConnection = null;
  logger.info("Mongo connection closed");
};

export const getMongoState = () => mongoose.connection.readyState;
