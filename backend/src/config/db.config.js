import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectDB = async () => {
  const databaseURI = process.env.DATABASE_URI;
  if (!databaseURI) throw new Error("DATABASE_URI is not defined");
  await mongoose.connect(databaseURI);
  console.log("MongoDB connected");
};
