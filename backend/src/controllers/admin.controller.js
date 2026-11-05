import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Booking from "../db/models/booking.js";
import User from "../db/models/user.js";
import Withdrawal from "../db/models/withdrawl.js";
import WalletTransaction from "../db/models/walletTransaction.js";
import { getWalletSummary } from "../services/wallet.service.js";
import { rescheduleBookingRecord } from "../services/bookingManagement.service.js";
import { cancelBookingCalendarEvent, updateBookingCalendarEvent } from "../services/googleCalendar.service.js";
import { sendBookingNotification } from "../services/sendBookingNoti.js";

const safeEqual = (leftValue, rightValue) => {
  const left = Buffer.from(String(leftValue || ""));
  const right = Buffer.from(String(rightValue || ""));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

export const adminLogin = async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const expectedEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const expectedPassword = process.env.ADMIN_PASSWORD || "";
  const secret = process.env.ADMIN_JWT_SECRET || "";

  if (!expectedEmail || !expectedPassword || !secret) {
    return res.status(503).json({ message: "Admin authentication is not configured on the server" });
  }
  if (!safeEqual(email, expectedEmail) || !safeEqual(password, expectedPassword)) {
    return res.status(401).json({ message: "Invalid admin email or password" });
  }

  const token = jwt.sign({ role: "admin" }, secret, { subject: "admin", expiresIn: "8h" });
  return res.json({ token, expiresIn: 28800 });
};

export const getAdminDashboard = async (_req, res) => {
  try {
    const paidMatch = { paymentStatus: "paid" };
    const [users, paidStats, withdrawals, withdrawalTotals, recentBookings] = await Promise.all([
      User.find().select("name email businessName slug payoutDetails.isComplete createdAt").sort({ createdAt: -1 }).limit(100).lean(),
      Booking.aggregate([
        { $match: paidMatch },
        { $group: {
          _id: null,
          paidBookings: { $sum: 1 },
          grossRevenue: { $sum: "$amount" },
          platformFees: { $sum: "$platformFeeAmount" },
          providerPayouts: { $sum: "$providerPayoutAmount" },
        } },
      ]),
      Withdrawal.find({ status: { $in: ["pending", "processing"] } })
        .populate("userId", "name businessName email")
        .sort({ createdAt: -1 })
        .lean(),
      Withdrawal.aggregate([
        { $match: { status: { $in: ["pending", "processing"] } } },
        { $group: { _id: null, amount: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Booking.find(paidMatch).populate("serviceId", "name").populate("userId", "name businessName").sort({ createdAt: -1 }).limit(20).lean(),
    ]);

    return res.json({
      summary: {
        users: await User.countDocuments(),
        ...(paidStats[0] || { paidBookings: 0, grossRevenue: 0, platformFees: 0, providerPayouts: 0 }),
        pendingWithdrawals: withdrawalTotals[0]?.count || 0,
        withdrawalHolds: withdrawalTotals[0]?.amount || 0,
      },
      users,
      withdrawals,
      recentBookings,
    });
  } catch (error) {
    return res.status(500).json({ message: "Could not load admin dashboard", error: error.message });
  }
};

export const listAdminBookings = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 30));
    const query = {};
    if (req.query.status && req.query.status !== "all") query.status = req.query.status;
    if (req.query.date) query.date = String(req.query.date);

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate("serviceId", "name duration price")
        .populate("userId", "name businessName email timeZone timezone")
        .sort({ date: -1, startTime: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Booking.countDocuments(query),
    ]);
    return res.json({ bookings, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    return res.status(500).json({ message: "Could not load bookings", error: error.message });
  }
};

export const updateAdminBookingStatus = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid booking ID" });
    const { status } = req.body;
    if (!["confirmed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Admin can confirm or cancel a booking" });
    }

    const booking = await Booking.findById(req.params.id).populate("serviceId", "name duration price");
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (status === "confirmed" && !["paid", "not_required"].includes(booking.paymentStatus)) {
      return res.status(409).json({ message: "A booking cannot be confirmed before payment is complete" });
    }
    const business = await User.findById(booking.userId);
    if (!business) return res.status(404).json({ message: "Provider not found" });
    booking.status = status;
    await booking.save();

    if (status === "cancelled") {
      try { await cancelBookingCalendarEvent({ business, booking }); }
      catch (error) { console.error("Admin booking calendar cancellation failed:", error.message); }
    } else if (status === "confirmed") {
      try {
        const result = await updateBookingCalendarEvent({ business, service: booking.serviceId, booking });
        booking.googleEventId = result.googleEventId || booking.googleEventId || "";
        booking.customerCalendarUrl = result.customerCalendarUrl || booking.customerCalendarUrl;
        await booking.save();
      } catch (error) {
        console.error("Admin booking calendar confirmation failed:", error.message);
      }
    }
    await booking.populate("userId", "name businessName email");
    const notification = sendBookingNotification({ business, service: booking.serviceId, booking, type: status })
      .catch((error) => ({ skipped: true, reason: error.message }));
    const email = await notification;
    return res.json({ message: "Booking updated", booking, email });
  } catch (error) {
    return res.status(500).json({ message: "Could not update booking", error: error.message });
  }
};

export const rescheduleAdminBooking = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid booking ID" });
    const { date, startTime, endTime } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    const business = await User.findById(booking.userId);
    if (!business) return res.status(404).json({ message: "Provider not found" });
    const { service } = await rescheduleBookingRecord({ booking, business, date, startTime, endTime });
    try {
      const result = await updateBookingCalendarEvent({ business, service, booking });
      booking.googleEventId = result.googleEventId || booking.googleEventId || "";
      booking.customerCalendarUrl = result.customerCalendarUrl || booking.customerCalendarUrl;
      await booking.save();
    } catch (error) {
      console.error("Admin booking calendar reschedule failed:", error.message);
    }
    await booking.populate("serviceId", "name duration price");
    await booking.populate("userId", "name businessName email");
    const email = await sendBookingNotification({ business, service, booking, type: "rescheduled" })
      .catch((error) => ({ skipped: true, reason: error.message }));
    return res.json({ message: "Booking rescheduled", booking, email });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message || "Could not reschedule booking" });
  }
};

export const updateWithdrawalStatus = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid withdrawal ID" });
    const { status, adminNote = "" } = req.body;
    if (!["processing", "paid", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be processing, paid, or rejected" });
    }

    let withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ message: "Withdrawal not found" });
    if (withdrawal.status === status) {
      // An earlier rejection may have changed the status before its ledger release completed.
      if (status === "rejected") await ensureWithdrawalReversal(withdrawal);
      withdrawal = await Withdrawal.findById(req.params.id).populate("userId", "name businessName email");
      return res.json({ message: "Withdrawal status is already up to date", withdrawal, summary: await getWalletSummary(withdrawal.userId._id) });
    }

    const validTransition = (
      (withdrawal.status === "pending" && ["processing", "rejected"].includes(status)) ||
      (withdrawal.status === "processing" && ["paid", "rejected"].includes(status))
    );
    if (!validTransition) return res.status(409).json({ message: `Cannot move a ${withdrawal.status} withdrawal to ${status}` });

    const previousStatus = withdrawal.status;
    withdrawal = await Withdrawal.findOneAndUpdate(
      { _id: withdrawal._id, status: previousStatus },
      { $set: { status, adminNote: String(adminNote).trim() } },
      { new: true },
    );
    if (!withdrawal) return res.status(409).json({ message: "Withdrawal was updated by another admin. Refresh and try again." });
    await WalletTransaction.updateOne(
      { withdrawalId: withdrawal._id, type: "withdrawal_hold" },
      { $set: { status } },
    );
    if (status === "rejected") await ensureWithdrawalReversal(withdrawal);

    const userId = withdrawal.userId;
    withdrawal = await withdrawal.populate("userId", "name businessName email");
    return res.json({
      message: status === "processing" ? "Withdrawal accepted for processing" : `Withdrawal marked ${status}`,
      withdrawal,
      summary: await getWalletSummary(userId),
    });
  } catch (error) {
    return res.status(500).json({ message: "Could not update withdrawal", error: error.message });
  }
};

const ensureWithdrawalReversal = async (withdrawal) => WalletTransaction.findOneAndUpdate(
  { withdrawalId: withdrawal._id, type: "withdrawal_reversal" },
  { $setOnInsert: {
    userId: withdrawal.userId,
    withdrawalId: withdrawal._id,
    type: "withdrawal_reversal",
    amount: withdrawal.amount,
    currency: withdrawal.currency,
    status: "rejected",
    description: "Withdrawal rejected; reserved balance released",
  } },
  { upsert: true, new: true, setDefaultsOnInsert: true },
);
