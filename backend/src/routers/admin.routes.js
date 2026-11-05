import express from "express";
import isAdmin from "../middlewares/isAdmin.middleware.js";
import {
  adminLogin,
  getAdminDashboard,
  listAdminBookings,
  rescheduleAdminBooking,
  updateAdminBookingStatus,
  updateWithdrawalStatus,
} from "../controllers/admin.controller.js";

const adminRoutes = express.Router();
adminRoutes.post("/login", adminLogin);
adminRoutes.use(isAdmin);
adminRoutes.get("/dashboard", getAdminDashboard);
adminRoutes.get("/bookings", listAdminBookings);
adminRoutes.patch("/bookings/:id/status", updateAdminBookingStatus);
adminRoutes.patch("/bookings/:id/reschedule", rescheduleAdminBooking);
adminRoutes.patch("/withdrawals/:id/status", updateWithdrawalStatus);

export default adminRoutes;
