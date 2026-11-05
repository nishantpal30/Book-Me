import express from "express";

import {
  getPublicBusiness,
  getPublicSlots,
  requestPublicBookingOtp,
  verifyPublicBookingOtp,
  createPublicBooking,
  verifyBookingPayment,
  getBookingStatus,
  cancelPublicBookingPayment,
} from "../controllers/public.controller.js";

const router = express.Router();

router.get("/booking/status", getBookingStatus);
router.post("/booking/payment/cancel", cancelPublicBookingPayment);

router.get("/:slug", getPublicBusiness);

router.post("/:slug/slots", getPublicSlots);

router.post("/:slug/otp/request", requestPublicBookingOtp);

router.post("/:slug/otp/verify", verifyPublicBookingOtp);

router.post("/:slug/book", createPublicBooking);

router.post("/:slug/payment/verify", verifyBookingPayment);

export default router;
