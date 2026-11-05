import EmailOtp from "../db/models/emailOtp.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { sendOtpNotification } from "./sendOTPNoti.js";
import { normalizedEmail } from "../utils/normalizedEMail.js";

const OTP_TIME = 10;


const otpGenerater = () =>{ return crypto.randomInt(100000,1000000).toString()};

export const emailOTP = async ({email,purpose}) =>{
const EMAIL = normalizedEmail(email);

if(!EMAIL){
    throw new Error("Email is needed!");
}
const OTP_CODE = otpGenerater();

const OTP_CODE_HASH = await bcrypt.hash(OTP_CODE, 10);
const OTP_EXPIRESSAT = new Date(Date.now() + OTP_TIME *60*1000);

await EmailOtp.deleteMany({email:EMAIL,purpose , consumeAt:null});
await EmailOtp.create({
    email: EMAIL,
    purpose,
    codeHash: OTP_CODE_HASH,
    expiresAt: OTP_EXPIRESSAT,
});
// after generate otp code notification function will we call
await sendOtpNotification({email:EMAIL, otp_code:OTP_CODE, purpose});
return{
    success:true,
    email:EMAIL,
    expiressAt:OTP_TIME
}

};


