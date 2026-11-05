import dotenv  from "dotenv";
dotenv.config();
import getSender from "./sender.info.config.js";
import ParseEmail from "../utils/parseEmail.js";

export const getEmailConfigStatus = () => {
  const sender = getSender();
  const missing = [];

  if (!process.env.BREVO_API_KEY) missing.push('BREVO_API_KEY');
  if (!sender.email) missing.push('BREVO_SENDER_EMAIL or EMAIL_FROM');
  if (sender.email && ParseEmail(sender.email) !== sender.email) {
    missing.push('valid BREVO_SENDER_EMAIL');
  }

  return {
    provider: 'brevo',
    status: missing.length === 0,
    configured: missing.length === 0,
    missing,
    from: sender.email,
    senderName: sender.name,
    mode: 'platform',
    requiresPerUserAuthorization: false,
  };
};


