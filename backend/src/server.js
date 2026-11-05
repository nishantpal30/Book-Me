import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { serverConfig } from "./config/server.config.js";
import { connectDB } from "./config/db.config.js";
import authrouter from "./routers/auth.routes.js";
import serviceRoutes from "./routers/services.routes.js";
import availabilityRoutes from "./routers/availability.routes.js";
import calendarRoutes from "./routers/calendar.routes.js";
import bookingRoutes from "./routers/booking.routes.js";
import paymentRoutes from "./routers/payment.routes.js";
import publicBookingRoutes from "./routers/public.routes.js"
import adminRoutes from "./routers/admin.routes.js";

// Middleware 
const allowedOrigins = [
  'http://localhost:5173',
  'https://bool-me-neon.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);
const app = express();
app.use(cors({
    origin: allowedOrigins, // exact origin, NOT "*"
    credentials: true,               // allow cookies / credentials
  }));
app.use(express.json());
app.use(cookieParser());

// routes
app.use("/api/auth",authrouter);
app.use("/api/services",serviceRoutes);
app.use("/api/availability",availabilityRoutes);
app.use("/api/calendar",calendarRoutes);
app.use("/api/booking",bookingRoutes);
app.use("/api/payments",paymentRoutes);
app.use("/api/public", publicBookingRoutes);
app.use("/api/admin", adminRoutes);



// server confic
const startServer = async () => {
  await connectDB();
  app.listen(serverConfig.PORT, () => {
    console.log(`Server running on port ${serverConfig.PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Server startup failed:", error.message);
  process.exit(1);
});
