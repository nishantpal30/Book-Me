import Availability from "../db/models/avalability.js";
import Booking from "../db/models/booking.js";
import Service from "../db/models/service.js";
import { timeOverlap } from "../utils/overlap.js";
import { isValidTimeRange } from "../utils/time.js";
import { isFutureLocalSlot, isValidDateString } from "../utils/localDate.js";

export const rescheduleBookingRecord = async ({ booking, business, date, startTime, endTime }) => {
  if (booking.status !== "confirmed") {
    throw Object.assign(new Error("Only confirmed bookings can be rescheduled"), { statusCode: 409 });
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(startTime || "")) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(endTime || "")) ||
      !isValidTimeRange(startTime, endTime)) {
    throw Object.assign(new Error("Choose a valid start and end time"), { statusCode: 400 });
  }
  if (!isValidDateString(date) || !isFutureLocalSlot(date, startTime, business.timeZone || business.timezone)) {
    throw Object.assign(new Error("Choose a future date and time"), { statusCode: 400 });
  }

  const service = await Service.findOne({ _id: booking.serviceId, userId: booking.userId });
  if (!service) throw Object.assign(new Error("Service not found"), { statusCode: 404 });
  const startMinutes = Number(startTime.slice(0, 2)) * 60 + Number(startTime.slice(3));
  const endMinutes = Number(endTime.slice(0, 2)) * 60 + Number(endTime.slice(3));
  if (endMinutes - startMinutes !== Number(service.duration)) {
    throw Object.assign(new Error(`This service requires a ${service.duration}-minute slot`), { statusCode: 400 });
  }

  const dayofWeek = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  const availability = await Availability.findOne({ userId: business._id, dayofWeek });
  const fitsAvailability = availability?.slots?.some((slot) => (
    startTime >= slot.startTime && endTime <= slot.endTime
  ));
  if (!fitsAvailability) {
    throw Object.assign(new Error("That time is outside the provider's availability"), { statusCode: 409 });
  }

  const activeBookings = await Booking.find({
    _id: { $ne: booking._id },
    userId: booking.userId,
    date,
    $or: [
      { status: "confirmed" },
      { status: "pending_payment", createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) } },
    ],
  }).select("startTime endTime").lean();
  if (activeBookings.some((candidate) => timeOverlap(startTime, endTime, candidate.startTime, candidate.endTime))) {
    throw Object.assign(new Error("That slot is already booked"), { statusCode: 409 });
  }

  booking.date = date;
  booking.startTime = startTime;
  booking.endTime = endTime;
  booking.isRescheduled = true;
  booking.rescheduleCount = (booking.rescheduleCount || 0) + 1;
  await booking.save();

  return { booking, service };
};
