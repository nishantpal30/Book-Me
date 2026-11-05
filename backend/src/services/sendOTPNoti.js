import emailTemplate from "../utils/emailTemplate.js";
import sendsEmail from "./sendsEmail.js";

export const sendOtpNotification = async ({ email, otp_code, purpose }) => {
  const title = purpose === 'registration' ? 'Verify your BookMe account' : 'Verify your booking email';
  const intro = `Use this verification code to continue. The code expires in 10 minutes.`;
  const htmlContent = emailTemplate({
    title,
    intro,
    rows: [
      { label: 'Verification code', value: otp_code },
      { label: 'Expires in', value: '10 minutes' },
    ],
    footer: 'If you did not request this code, you can ignore this email.',
  });

  return sendsEmail({
    to: email,
    subject: title,
    text: `${intro}\n\nVerification code: ${otp_code}\nExpires in: 10 minutes`,
    htmlContent,
  });
};
