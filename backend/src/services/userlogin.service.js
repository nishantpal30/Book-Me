import bcrypt from "bcryptjs";
import User from "../db/models/user.js";
import { loginInpu_Validater } from "../validators/filldetails.validators.js";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";

export const userLogin_Service = async (data) => {
  // console.log(data)
  const { email, password } = data;
  const userLogin_Input = loginInpu_Validater(data);
  
  if (userLogin_Input.success === false) {
    // console.log(userLogin_Input)
    return {
      statusCode: userLogin_Input.statusCode,
      success: userLogin_Input.success,
      message: userLogin_Input.message,
    };
  } else {
    const userEmail = email.toLowerCase().trim();
    const checkUser = await User.findOne({ email: userEmail });
    if (!checkUser) {
      return {
        statusCode:StatusCodes.BAD_REQUEST,
        userLogin_Input,
        message: "User does not exist with this email",
        success:false,
      };
    }
    const matchPassword = await bcrypt.compare(password, checkUser.password);
    if (!matchPassword) {
      return {
        userLogin_Input,
        message: "Worng Passward",
        statusCode: StatusCodes.BAD_REQUEST,
        success:false,
      };
    }
    const createToken = jwt.sign(
      { userId: String(checkUser._id) },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1d" },
    );
    return {
      statusCode:StatusCodes.CREATED,
        userLogin_Input,
        success:true,
        createToken,
        checkUser,
        message:"User Login success"
    }
  }
};
