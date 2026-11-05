import { registerOTP_Service } from "../services/registerOTP.service.js";
import { StatusCodes } from "http-status-codes";
import { registerService } from "../services/register.service.js";
import User from "../db/models/user.js";
import { verifyOTP } from "../services/verifyOTP.js";
import { userLogin_Service } from "../services/userlogin.service.js";
import slugify from "../utils/slug.js";
import { toUserResponse } from "../utils/touserResponse.js";

export const registerUser = async (req, res) => {
  try {
    // console.log(req.body)
    const registerResponse = await registerService(req.body);
    const response = {
      success: Boolean(registerResponse.success),
      message: registerResponse.message,
      user: registerResponse.user ? toUserResponse(registerResponse.user) : undefined,
      token: registerResponse.createToken,
    };
    return res.status(registerResponse.statusCode).json(response);
  } catch (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: error.message,
      success: false,
    });
  }
};

export const registerOTP = async (req, res) => {
  try {
    const { email } = req.body;
console.log(email);
    const OTPemail = email?.toLowerCase().trim();
console.log(OTPemail)
    if (!OTPemail) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Email is required" });
    }
    const registerOTP_Response = await registerOTP_Service({
      userEmail: OTPemail,
    });
    // console.log(registerOTP_Response)
    return res
      .status(registerOTP_Response.statusCode)
      .json(registerOTP_Response);
  } catch (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: error.message,
      success: false,
    });
  }
};

export const verifyRegistration_OTP = async (req, res) => {
  try {
    const email = req.body.email;
    const emailOTP = req.body.emailOTP || req.body.emailOtp;
    const userEmail = email?.toLowerCase().trim();
    if (!userEmail || !emailOTP) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Email and Otp is Required" });
    }

    const userExist = await User.findOne({ email: userEmail });
    if (userExist) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Email is already Exist" });
    }
    const verifyOTP_Result = await verifyOTP({
      email: userEmail,
      purpose: "registration",
      otp_Code: emailOTP,
      consume: false,
    });

    if (!verifyOTP_Result.verified) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: verifyOTP_Result.message,
      });
    }

    return res.status(StatusCodes.OK).json(verifyOTP_Result);
  } catch (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: error.message,
      success: false,
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const loginUser_Response = await userLogin_Service(req.body);
    // console.log(loginUser_Response);
    if (loginUser_Response.success == true) {
      return res.status(loginUser_Response.statusCode).json({
          success: loginUser_Response.success,
          message: loginUser_Response.message,
          user: toUserResponse(loginUser_Response.checkUser),
          token: loginUser_Response.createToken,
        });
    } else {
      return res.status(loginUser_Response.statusCode).json({
        message: loginUser_Response.message,
      });
    }
  } catch (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: error.message,
      success: false,
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const {
      businessName,
      businessDiscription,
      businessDescription,
      timezone,
      brandTheme,
      brandAccent,
    } = req.body;

    if (timezone !== undefined) {
      try {
        new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
      } catch {
        return res.status(400).json({ message: "Choose a valid time zone" });
      }
    }

    const user = await User.findById(req.user?.id?.userId);
    // console.log(user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (businessName !== undefined) user.businessName = businessName;
    const nextDescription = businessDescription ?? businessDiscription;
    if (nextDescription !== undefined) {
      user.businessDescription = nextDescription;
      user.businessDiscription = nextDescription;
    }
    if (timezone !== undefined) {
      user.timeZone = timezone;
      user.timezone = timezone;
    }
    if (brandTheme !== undefined) user.brandTheme = brandTheme;
    if (brandAccent !== undefined) user.brandAccent = brandAccent;

    const baseSlug = slugify(user.businessName || user.name) || "business";
    let finalSlug = baseSlug;
    let counter = 1;

    while (await User.findOne({ slug: finalSlug, _id: { $ne: user._id } })) {
      finalSlug = `${baseSlug}-${counter}`;
      counter += 1;
    }

    user.slug = finalSlug;

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: toUserResponse(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user?.id?.userId).select("-password");
    //  console.log( "user",user)
    if (!user) {
      return res.status(404).json({
        message: "user not found",
      });
    }
    res.json({ user: toUserResponse(user) });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
