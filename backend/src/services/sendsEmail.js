import { getEmailConfigStatus } from "../config/getEmailconfigStatus.js";
import getPlatformSender from "../utils/getplatformsender.js";
import getReplyToEmail from "../utils/getReplytoEmail.js";
import https from "https";
import dotenv from "dotenv";


dotenv.config();

const BREVO_TRANS_EMAIL_URI = "https://api.brevo.com/v3/smtp/email";
const getBrevoErrorMessage = (statusCode, parsed) => {
  const message =
    parsed.message || `Brevo email failed with status ${statusCode}`;

  return String(message);
};
const sendsEmail = ({
  to,
  subject,
  text,
  htmlContent,
  senderName,
  replyToEmail,
}) => {
  const checkBravoEmail = getEmailConfigStatus();

  // here check bravo have all okk config or not
  if (!checkBravoEmail.status) {
    throw new Error(
      `BREVO email is not configured. Missing: ${checkBravoEmail.missing.join(", ")}`,
    );
  }

  // extract all the sender or sending data
  const sendingData = {
    sender: getPlatformSender(senderName),
    to: [{ email: to }],
    subject,
    textContent: text,
    htmlContent,
  };
  // if reply email is present then add it to sending data other wise not add
  const checkReplytoEmail = getReplyToEmail(replyToEmail);
  if (checkReplytoEmail) {
    sendingData.replyTo = checkReplytoEmail;
  }
  const emailpastData = JSON.stringify(sendingData);
  // console.log(emailpastData);
// console.log(process.env.BREVO_API_KEY);
  return new Promise((resolve, reject) => {
    const req = https.request(
      BREVO_TRANS_EMAIL_URI,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "api-key":process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(emailpastData),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          let parsed = {};
          try {
            parsed = JSON.parse(body);
           
          } catch (e) {}

          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({
              sent: true,
              provider: "brevo",
              messageId: parsed.messageId,
            });
          } else {
            reject(new Error(getBrevoErrorMessage(res.statusCode, parsed)));
          }
        });
      },
    );

    req.on("error", (e) => reject(e));
    req.write(emailpastData);
    req.end();
  });
};
export default sendsEmail;
