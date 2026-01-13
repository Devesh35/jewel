import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

const DEFAULT_ENV = "development";

const nodeEnv = process.env.NODE_ENV || DEFAULT_ENV;

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = nodeEnv;
}

const projectRoot = path.resolve(__dirname, "..", "..");
const baseEnvPath = path.join(projectRoot, ".env");
const envSpecificPath = path.join(projectRoot, `.env.${nodeEnv}`);

const readEnvFile = (filePath: string) => {
  if (!fs.existsSync(filePath)) return undefined;

  return dotenv.parse(fs.readFileSync(filePath));
};

export const loadEnv = () => {
  const baseEnv = readEnvFile(baseEnvPath) ?? {};
  const envSpecific = readEnvFile(envSpecificPath) ?? {};

  const mergedEnv = { ...baseEnv, ...envSpecific };

  for (const [key, value] of Object.entries(mergedEnv)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  if (fs.existsSync(envSpecificPath)) {
    process.env.LOADED_ENV_FILE = path.basename(envSpecificPath);
    return;
  }

  if (fs.existsSync(baseEnvPath)) {
    process.env.LOADED_ENV_FILE = path.basename(baseEnvPath);
  }
};

loadEnv();
