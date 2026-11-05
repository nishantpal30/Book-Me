import { getEmailConfigStatus } from "../config/getEmailconfigStatus.js";
import sendsEmail from "./sendsEmail.js";
import bookingMessage from "../utils/bookingMessage.js";






export const sendBookingNotification = async ({ business, service, booking, type = 'confirmed' }) => {
  const configStatus = getEmailConfigStatus();
  if (!configStatus.configured) {
    return {
      skipped: true,
      reason: `BREVO email is not configured. Missing: ${configStatus.missing.join(', ')}`,
    };
  }

  const recipients = [
    { email: booking.customerEmail, type: 'customer' },
    { email: business.email, type: 'provider' },
  ].filter((recipient, index, list) => (
    recipient.email && list.findIndex((candidate) => candidate.email === recipient.email) === index
  ));

  const results = [];
  for (const recipient of recipients) {
    const message = bookingMessage({
      business,
      service,
      booking,
      type,
      recipientType: recipient.type,
    });

    const result = await sendsEmail({
      to: recipient.email,
      senderName: business.businessName || business.name || 'BookMe',
      replyToEmail: recipient.type === 'customer'
        ? { email: business.email, name: business.businessName || business.name || 'Provider' }
        : { email: booking.customerEmail, name: booking.customerName || 'Customer' },
      ...message,
    });
    results.push({ email: recipient.email, type: recipient.type, ...result });
  }

  return { sent: true, provider: 'brevo', recipients: results };
};
