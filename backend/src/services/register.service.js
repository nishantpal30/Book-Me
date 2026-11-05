import { StatusCodes } from "http-status-codes";
import { filldetailsVerification } from "../validators/filldetails.validators.js";
import User from "../db/models/user.js";
import { otpvalidators } from "../validators/otp.validators.js";
import slugify from "../utils/slug.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const registerService = async (data) => {
  const {
    name,
    email,
    password,
    businessName,
    businessDescription,
    timezone,
    emailOtp,
  } = data;
  const filldetailsVerify = await filldetailsVerification(data);
  if (!filldetailsVerify.success) {
    return {
      message: filldetailsVerify.message,
      status: filldetailsVerify.status,
      statusCode: filldetailsVerify.statusCode,
    };
  }

  const userEmail = email.toLowerCase().trim();
  // const value = {
  //   userEmail,
  //   purpose: "registration",
  //   otp_Code:emailotp,
  //   consume: true,
  // };
  // console.log(emailOtp);
  const OTPverification = await otpvalidators({ email: userEmail,
    purpose:"registration",
    emailOtp,
    consume:true});
  if (!OTPverification.success) {
    return {
      message: OTPverification.message,
      statusCode: OTPverification.statusCode,
      success: OTPverification.success,
    };
  }
  const slug = slugify(businessName || name) || "business";
  let finalslug = slug;
  let counter = 1;
  while (await User.findOne({ slug: finalslug })) {
    finalslug = `${slug}-${counter}`;
    counter += 1;
  }

  const hashPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: userEmail,
    password: hashPassword,
    slug: finalslug,
    businessName: businessName || " ",
    businessDiscription:businessDescription || "",
    businessDescription:businessDescription || "",
    timeZone: timezone || "Asia/Kolkata",
    timezone: timezone || "Asia/Kolkata",
  });
  const createToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "1d" },
  );
  return {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "User is created successfully!",
    user,
    createToken,
  };
};
