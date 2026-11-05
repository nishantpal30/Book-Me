import crypto from "crypto";
import Booking from "../db/models/booking.js";
import Service from "../db/models/service.js";
import User from "../db/models/user.js";
import { buildCustomerCalendar } from "../utils/calendarlink.js";
import { createBookingCalendarEvent } from "../services/googleCalendar.service.js";
import { sendBookingNotification } from "../services/sendBookingNoti.js";
import { generateSlots } from "../services/slotgenerator.service.js";
import { getrzp, toRzpAmount } from "../utils/razorpay.js";
import { calculatePlatformFee } from "../utils/platformcharge.js";
import { timeOverlap } from "../utils/overlap.js";
import { bookingPayouttransation } from "../services/wallet.service.js";
import { normalizedEmail } from "../utils/normalizedEMail.js";
import { emailOTP } from "../services/emailOTP.js";
import { verifyOTP } from "../services/verifyOTP.js";
import { isFutureLocalSlot, isValidDateString, localDateString } from "../utils/localDate.js";


// BUSINESS
const getBusinessBySlug = async (slug) => {
  return User.findOne({
    slug,
  }).select("-password");
};

// PUBLIC BUSINESS INFORMATION
const toPublicInfo = (business) => ({
  id: business._id,
  name: business.name,
  slug: business.slug,
  businessDescription: business.businessDescription || business.businessDiscription || "",
  brandTheme: business.brandTheme,
  brandAccent: business.brandAccent,
  timezone: business.timeZone || business.timezone || "Asia/Kolkata",
  googleCalendarConnected: Boolean(business.googleCalendarConnected || business.googleCalenderConnected),
});

// GET PUBLIC BUSINESS
export const getPublicBusiness = async (req, res) => {
  try {
    const { slug } = req.params;
// console.log(req.params)
    const business = await getBusinessBySlug(slug);

    if (!business) {
      return res.status(404).json({
        message: "Business not found",
      });
    }

    const services = await Service.find({
      userId: business._id,
      isActive: true,
      isDeleted: {
        $ne: true,
      },
    }).sort({
      name: 1,
    });

    return res.json({
      business: toPublicInfo(business),
      services,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// GET PUBLIC SLOTS
export const getPublicSlots = async (req, res) => {
  try {
    
     const body = req.body ?? {};
    const { serviceId, date } = body.params ?? body;
// console.log(serviceId,date)
    if (!date || !serviceId) {
      return res.status(400).json({
        message: "Date and service are required",
      });
    }

    const { slug } = req.params;
// console.log(slug)
    const business = await getBusinessBySlug(slug);

    if (!business) {
      return res.status(404).json({
        message: "Business not found",
      });
    }

    const service = await Service.findOne({
      _id: serviceId,
      userId: business._id,
      isActive: true,
      isDeleted: {
        $ne: true,
      },
    });

    if (!service) {
      return res.status(404).json({
        message: "Service not found",
      });
    }

    const timeZone = business.timeZone || business.timezone;
    if (!isValidDateString(date) || date < localDateString(new Date(), timeZone)) {
      return res.json({ slots: [] });
    }

    const slots = await generateSlots({
      userId: business._id,
      service,
      date,
      timeZone,
    });
// console.log(slots)
    return res.json({
      slots,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// REQUEST BOOKING OTP
export const requestPublicBookingOtp = async (req, res) => {
  try {
    const { customerEmail } = req.body;
    const userEmail = normalizedEmail(customerEmail);

    if (!userEmail) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const { slug } = req.params;

    const business = await getBusinessBySlug(slug);

    if (!business) {
      return res.status(404).json({
        message: "Business not found",
      });
    }

    const requestOtp = await emailOTP({
      email: userEmail,
      purpose: "booking",
    });

    return res.json({
      message: "OTP sent successfully",
      requestOtp,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// VERIFY BOOKING OTP
export const verifyPublicBookingOtp = async (req, res) => {
  try {
    const { customerEmail, emailOtp } = req.body;
// console.log(customerEmail,emailOtp)
    if (!customerEmail || !emailOtp) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }

    const otpResult = await verifyOTP({
      email: customerEmail,
      purpose: "booking",
      emailOtp,
      consume: false,
    });
// console.log(otpResult)
    if (!otpResult.verified) {
      return res.status(400).json({
        message: otpResult.message || "Invalid OTP",
      });
    }

    return res.json({
      message: "OTP verified",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// CREATE PUBLIC BOOKING
export const createPublicBooking = async (req, res) => {
  try {
    const {
      serviceId,
      customerName,
      customerEmail,
      customerAvatar,
      date,
      startTime,
      endTime,
      notes,
      emailOtp,
    } = req.body;

    // VALIDATE INPUT
    if (
      !serviceId ||
      !customerName ||
      !customerEmail ||
      !date ||
      !startTime ||
      !endTime
    ) {
      return res.status(400).json({
        message: "All booking fields are required",
      });
    }

    const normalizedCustomerEmail = normalizedEmail(customerEmail);
    const { slug } = req.params;

    const business = await getBusinessBySlug(slug);

    if (!business) {
      return res.status(404).json({
        message: "Business not found",
      });
    }
    const service = await Service.findOne({
      _id: serviceId,
      userId: business._id,
      isActive: true,
      isDeleted: {
        $ne: true,
      },
    });

    if (!service) {
      return res.status(404).json({
        message: "Service not found",
      });
    }
    if (!isValidDateString(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(startTime)) ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(endTime)) ||
        !isFutureLocalSlot(date, startTime, business.timeZone || business.timezone)) {
      return res.status(400).json({ message: "Choose a valid future date and time" });
    }
    const availableSlots = await generateSlots({
      userId: business._id,
      service,
      date,
      timeZone: business.timeZone || business.timezone,
    });
    const selectedSlotIsAvailable = availableSlots.some((slot) => slot.startTime === startTime && slot.endTime === endTime);
    if (!selectedSlotIsAvailable) {
      return res.status(409).json({
        message: "That slot is outside availability or is no longer available",
      });
    }
    const amount = toRzpAmount(service.price);
    const { platformFeeAmount, providerPayoutAmount } = calculatePlatformFee(amount);
    const currency = "inr";
    const rzp = amount > 0 ? getrzp() : null;
    if (amount > 0 && !rzp) {
      return res.status(503).json({
        message:
          "Razorpay payments are not configured on the server. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
      });
    }

    const otpResult = await verifyOTP({
      email: normalizedCustomerEmail,
      purpose: "booking",
      emailOtp,
      consume: true,
    });

    if (!otpResult.verified) {
      return res.status(400).json({
        message: otpResult.message || "Email verification is required",
      });
    }

    const customerCalendarUrl = buildCustomerCalendar({
      business,
      service,

      booking: {
        date,
        startTime,
        endTime,
        customerName,
        customerEmail: normalizedCustomerEmail,
        notes,
      },
    });

    const booking = await Booking.create({
      userId: business._id,
      serviceId,
      customerName,
      customerEmail: normalizedCustomerEmail,
      customerAvatar: customerAvatar || "A1.png",
      date,
      endTime,
      startTime,
      notes: notes || "",
      amount,
      platformFeeAmount,
      providerPayoutAmount,
      payoutStatus: amount > 0 ? "pending" : "not_required",
      currency,
      paymentStatus: amount > 0 ? "pending" : "not_required",
      status: amount > 0 ? "pending_payment" : "confirmed",
      customerCalendarUrl,
    });

    // FREE BOOKING
    if (amount === 0) {
      try {
        const calendarResult = await createBookingCalendarEvent({
          business,
          service,
          booking,
        });

        booking.googleEventId = calendarResult.googleEventId || "";

        booking.customerCalendarUrl =
          calendarResult.customerCalendarUrl || customerCalendarUrl;

        await booking.save();
      } catch (calendarError) {
        console.error("Google Calendar error:", calendarError.message);

        booking.customerCalendarUrl = customerCalendarUrl;

        await booking.save();
      }

      // Send confirmation email asynchronously

      sendBookingNotification({
        business,
        service,
        booking,
        type: "confirmed",
      }).catch((emailError) => {
        console.error("Booking confirmation email failed:", emailError.message);
      });

      return res.status(201).json({
        message: "Booking confirmed",

        booking,

        customerCalendarUrl: booking.customerCalendarUrl,

        email: {
          sent: "processing",
        },
      });
    }

    // RAZORPAY PAYMENT

    const order = await rzp.orders.create({
      amount,

      currency: "INR",

      receipt: `booking_${booking._id}`,

      notes: {
        bookingId: String(booking._id),

        serviceId: String(service._id),

        customerEmail: normalizedCustomerEmail,
      },
    });

    // SAVE RAZORPAY ORDER ID
    booking.razorpayOrderId = order.id;

    await booking.save();
    // SEND ORDER DETAILS TO FRONTEND
    return res.status(201).json({
      message: "Continue to payment",
      bookingId: booking._id,
      razorpayOrderId: order.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("Create booking error:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// RAZORPAY SIGNATURE VERIFICATION
const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
  if (
    !orderId ||
    !paymentId ||
    !signature ||
    !process.env.RAZORPAY_KEY_SECRET
  ) {
    return false;
  }

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(generatedSignature, "utf8"),
      Buffer.from(signature, "utf8"),
    );
  } catch {
    return false;
  }
};

// CONFIRM PAID BOOKING
const confirmPaidBooking = async ({ booking, business, service }) => {
  // ALREADY CONFIRMED
  if (booking.status === "confirmed" && booking.paymentStatus === "paid") {
    return booking;
  }
  // CHECK SLOT AGAIN
  const conflictingBookings = await Booking.find({
    _id: {
      $ne: booking._id,
    },
    userId: booking.userId,
    date: booking.date,
    status: "confirmed",
  });

  const hasConflict = conflictingBookings.some((candidate) =>
    timeOverlap(
      booking.startTime,
      booking.endTime,
      candidate.startTime,
      candidate.endTime,
    ),
  );

  if (hasConflict) {
    booking.paymentStatus = "failed";
    booking.status = "payment_failed";
    await booking.save();

    throw new Error(
      "This slot is no longer available. No booking was created.",
    );
  }


  // UPDATE PAYMENT STATUS
 

  booking.status = "confirmed";
  booking.paymentStatus = "paid";
  booking.payoutStatus =
    booking.providerPayoutAmount > 0 ? "available" : "not_required";
  // GOOGLE CALENDAR

  try {
    const calendarResult = await createBookingCalendarEvent({
      business,
      service,
      booking,
    });

    booking.googleEventId = calendarResult.googleEventId || "";

    booking.customerCalendarUrl =
      calendarResult.customerCalendarUrl || booking.customerCalendarUrl;
  } catch (calendarError) {
    console.error(
      "Google Calendar confirmation failed:",
      calendarError.message,
    );
  }
  // SAVE BOOKING
  await booking.save();
  // CREATE WALLET PAYOUT
  await bookingPayouttransation({
    booking,

    description: `Booking payment from ${booking.customerName || "Customer"}`,
  });
  // SEND EMAIL
  sendBookingNotification({
    business,
    service,
    booking,
    type: "confirmed",
  }).catch((emailError) => {
    console.error("Booking confirmation email failed:", emailError.message);
  });

  return booking;
};

// VERIFY RAZORPAY PAYMENT
export const verifyBookingPayment = async (req, res) => {
  try {
    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // VALIDATION
    if (
      !bookingId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        message: "Booking ID and Razorpay payment details are required",
      });
    }

    // FIND BOOKING

    let booking = await Booking.findOne({
      _id: bookingId,
      razorpayOrderId: razorpay_order_id,
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking or Razorpay order not found",
      });
    }
    // ALREADY PAID
    if (booking.status === "confirmed" && booking.paymentStatus === "paid") {
      return res.json({
        message: "Payment already verified",

        booking,
      });
    }
    // VERIFY SIGNATURE
    const isValid = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      booking.paymentStatus = "failed";
      booking.status = "payment_failed";
      await booking.save();

      return res.status(400).json({
        message: "Invalid Razorpay payment signature",
      });
    }
    // SAVE RAZORPAY PAYMENT DETAILS
    booking.razorpayPaymentId = razorpay_payment_id;
    booking.razorpaySignature = razorpay_signature;
    // GET BUSINESS + SERVICE

    const [business, service] = await Promise.all([
      User.findById(booking.userId),

      Service.findById(booking.serviceId),
    ]);

    if (!business || !service) {
      return res.status(404).json({
        message: "Booking business or service was not found",
      });
    }
    // CONFIRM BOOKING
    await confirmPaidBooking({
      booking,
      business,
      service,
    });
    // GET UPDATED BOOKING

    booking = await Booking.findById(booking._id).populate(
      "serviceId",
      "name duration price",
    );

    return res.json({
      message: "Payment verified and booking confirmed",

      booking,
    });
  } catch (error) {
    console.error("Razorpay verification error:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// GET BOOKING STATUS
export const getBookingStatus = async (req, res) => {
  try {
    const { booking_id: bookingId } = req.query;

    if (!bookingId) {
      return res.status(400).json({
        message: "Booking identifier is required",
      });
    }

    const booking = await Booking.findById(bookingId).populate(
      "serviceId",
      "name duration price",
    );

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    return res.json({
      booking,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// CANCEL PAYMENT
export const cancelPublicBookingPayment = async (req, res) => {
  try {
    const { booking_id: bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        message: "Booking identifier is required",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,

      status: "pending_payment",
    });

    if (!booking) {
      return res.json({
        message: "No pending booking to cancel",
      });
    }
    booking.status = "payment_failed";
    booking.paymentStatus = "failed";
    await booking.save();

    return res.json({
      message: "Payment was not completed. No booking was created.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
