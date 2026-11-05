import Booking from "../db/models/booking.js";
import User from "../db/models/user.js";
import { buildCustomerCalendar } from "../utils/calendarlink.js";
import { cancelBookingCalendarEvent,updateBookingCalendarEvent } from "../services/googleCalendar.service.js";
import { sendBookingNotification } from "../services/sendBookingNoti.js";
import { rescheduleBookingRecord } from "../services/bookingManagement.service.js";



export const listofBooking = async (req , res) =>{
    try {
        const query = { userId:req.user?.id?.userId };
        const bookingStatus = req.query.status;
        if (bookingStatus === "rescheduled") query.isRescheduled = true;
        else if (bookingStatus) query.status = bookingStatus;
        if (!bookingStatus || bookingStatus === "rescheduled") {
          query.status = { $nin: ["pending_payment", "payment_failed"] };
        }
    let bookingDate = req.query.date;
    if (bookingDate) query.date = bookingDate;

       const [bookings, business] = await Promise.all([
      Booking.find(query)
        .populate('serviceId', 'name duration price')
        .sort({ createdAt: -1 })
        .lean(),
      User.findById(req.user?.id?.userId).select('name businessName timeZone timezone').lean(),
    ]);

    const bookingsWithCalendarUrls = bookings.map((booking) => {
      if (booking.customerCalendarUrl || !business || !booking.serviceId) {
        return booking;
      }

      return {
        ...booking,
        customerCalendarUrl: buildCustomerCalendar({
          business,
          service: booking.serviceId,
          booking,
        }),
      };
    });
res.json({ bookings: bookingsWithCalendarUrls });
    } catch (error) {
         res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["confirmed", "cancelled"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid booking status' });
    }

    const booking = await Booking.findOne({ _id: req.params.id, userId: req.user?.id?.userId });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (status === "confirmed" && !["paid", "not_required"].includes(booking.paymentStatus)) {
      return res.status(409).json({ message: "A booking cannot be confirmed before payment is complete" });
    }
    booking.status = status;
    await booking.save();
    await booking.populate('serviceId', 'name duration price');

    const business = await User.findById(req.user?.id?.userId);
    if (business && status === "confirmed" && booking.serviceId) {
      try {
        const calendarResult = await updateBookingCalendarEvent({ business, service: booking.serviceId, booking });
        booking.googleEventId = calendarResult.googleEventId || booking.googleEventId || "";
        booking.customerCalendarUrl = calendarResult.customerCalendarUrl || booking.customerCalendarUrl;
        await booking.save();
      } catch (calendarError) {
        console.error("Google Calendar confirmation failed:", calendarError.message);
      }
    }
    if (business && status === 'cancelled') {
      try {
        await cancelBookingCalendarEvent({ business, booking });
      } catch (calendarError) {
        console.error('Google Calendar cancellation failed:', calendarError.message);
      }
    }

    let emailResult = null;
    if (business && booking.serviceId) {
      emailResult = { sent: 'processing' };
      sendBookingNotification({
        business,
        service: booking.serviceId,
        booking,
        type: status === 'cancelled' ? 'cancelled' : 'status',
      }).catch(emailError => console.error('Booking status email failed:', emailError.message));
    }

    res.json({ message: 'Booking updated', booking, email: emailResult });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const rescheduleBooking = async (req, res) => {
  try {
    const { date, startTime, endTime } = req.body;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({ message: 'Date, start time, and end time are required' });
    }

    const booking = await Booking.findOne({ _id: req.params.id, userId: req.user?.id?.userId});
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const business = await User.findById(req.user?.id?.userId);
    if (!business) return res.status(404).json({ message: "Provider not found" });
    let service;
    try {
      ({ service } = await rescheduleBookingRecord({ booking, business, date, startTime, endTime }));
    } catch (error) {
      return res.status(error.statusCode || 400).json({ message: error.message });
    }

    if (business && service) {
      try {
        const calendarResult = await updateBookingCalendarEvent({ business, service, booking });
        booking.googleEventId = calendarResult.googleEventId || booking.googleEventId || '';
        booking.customerCalendarUrl = calendarResult.customerCalendarUrl || booking.customerCalendarUrl;
      } catch (calendarError) {
        console.error('Google Calendar reschedule failed:', calendarError.message);
      }
    }
    await booking.save();

    const populatedBooking = await Booking.findById(booking._id).populate('serviceId', 'name duration price');

    let emailResult = null;
    if (business && service) {
      emailResult = { sent: 'processing' };
      sendBookingNotification({ business, service, booking: populatedBooking, type: 'rescheduled' })
        .catch(emailError => console.error('Booking reschedule email failed:', emailError.message));
    }

    res.json({ message: 'Booking rescheduled', booking: populatedBooking, email: emailResult });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
