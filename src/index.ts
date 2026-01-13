import { appConfig, env } from "./config/env";
import { createApp, shutdownApp } from "./core/app";
import { logger } from "./utils/logger";

const bootstrap = async () => {
  const app = await createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`Server listening on ${appConfig.baseUrl}`);
  });

  const shutdown = shutdownApp(server);

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  process.on("uncaughtException", (err) => {
    logger.error({ err }, "Uncaught exception");
    shutdown();
  });
  process.on("unhandledRejection", (reason) => {
    logger.error({ reason }, "Unhandled rejection");
    shutdown();
  });
};

bootstrap().catch((err) => {
  logger.error({ err }, "Failed to bootstrap application");
  process.exit(1);
});
