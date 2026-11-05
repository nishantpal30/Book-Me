import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendEnvPath = fileURLToPath(new URL("../../.env", import.meta.url));
const workingDirectoryEnvPath = path.resolve(process.cwd(), ".env");

// Always find backend/.env, even when the server is launched from the repo root.
// Keep the working-directory .env as a fallback for existing deployments.
dotenv.config({ path: [...new Set([backendEnvPath, workingDirectoryEnvPath])] });

export const serverConfig = {
  PORT: Number(process.env.PORT) || 3001,
};
