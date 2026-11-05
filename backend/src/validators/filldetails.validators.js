import { StatusCodes } from "http-status-codes";
import User from "../db/models/user.js";

export const filldetailsVerification = async (data) =>{
     const {name , email , password} = data
    if( !name || !email || !password) {
        return{
            statusCode:StatusCodes.NOT_FOUND,
            message:"Name , Email and Password is required",
            status:false,
        }
    }
    const emailcheck = await User.findOne({ email: String(email).trim().toLowerCase() });
if(emailcheck)
    {
    return{
        message :"User email already exist",
        success : false,
        statusCode : StatusCodes.TOO_MANY_REQUESTS
    }
};

return{
    message:"All input details okk",
    success:true,
    statusCode:StatusCodes.OK
  };
};

export const loginInpu_Validater = (data) =>{
  
    const { email , password} = data
    if( !email || !password) {
        return{
            statusCode:StatusCodes.BAD_GATEWAY,
            message:"Email and Password is required",
            success:false,
        }
    }

        return{
            
    message:"All input details okk",
    success:true,
    statusCode:StatusCodes.OK
  };
    
}
