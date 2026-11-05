import dotenv from "dotenv";

dotenv.config();

export const serverConfig = {
  PORT: Number(process.env.PORT) || 3001,
};
