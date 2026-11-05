import formatDateTime from "./formatDateTime.js";
import formatMoney from "./formatMoney.js";
import buildIntro from "./emailIntro.js";
import buildSubject from "./emailSubject.js";
import emailTemplate from "./emailTemplate.js";

const bookingMessage = ({
  business,
  service,
  booking,
  type,
  recipientType,
}) => {
  const businessName = business.businessName || business.name || "BookMe";
  const serviceName = service.name || "appointment";
  const appointmentTime = formatDateTime(booking, business.timeZone || business.timezone);
  const bookingStatus = String(booking.status || "").replace("_", " ");
  const paymentStatus = String(booking.paymentStatus || "not_required").replace(
    "_",
    " ",
  );
  const amount = formatMoney(booking.amount || 0, booking.currency || "inr");
  const intro = buildIntro({ type, serviceName, recipientType });
  const subject = buildSubject(type, businessName, recipientType);
  const title =
    recipientType === "provider" ? "Booking update" : "Booking confirmation";

  const rows = [
    { label: "Business", value: businessName },
    { label: "Service", value: serviceName },
    { label: "Customer", value: booking.customerName },
    { label: "Customer email", value: booking.customerEmail },
    { label: "When", value: appointmentTime },
    { label: "Status", value: bookingStatus },
    { label: "Payment", value: paymentStatus },
    { label: "Amount", value: amount },
    { label: "Booking ID", value: String(booking._id || "") },
  ];

  const text = [
    intro,
    "",
    ...rows.map((row) => `${row.label}: ${row.value}`),
    booking.notes ? `Notes: ${booking.notes}` : "",
    booking.customerCalendarUrl
      ? `Calendar link: ${booking.customerCalendarUrl}`
      : "",
    "",
    recipientType === "provider"
      ? "This notification was sent by BookMe."
      : `Thank you for booking with ${businessName}.`,
  ]
    .filter(Boolean)
    .join("\n");

  const htmlContent = emailTemplate({
    title,
    eyebrow: businessName,
    intro,
    rows,
    accent: business.brandAccent || "#7D57F5",
    notes: booking.notes,
    calendarUrl:
      recipientType === "customer" ? booking.customerCalendarUrl : "",
    footer:
      recipientType === "provider"
        ? "This notification was sent by BookMe because a customer booked through your booking page."
        : `Thank you for booking with ${businessName}. Please keep this email for your records.`,
  });

  return { subject, text, htmlContent };
};
