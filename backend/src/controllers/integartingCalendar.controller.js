import { StatusCodes } from "http-status-codes";
import User from "../db/models/user.js";
import { getGoogleAuthURI, getGoogleTokens } from "../services/googleCalendar.service.js";
import jwt from "jsonwebtoken";

const frontendUrl = () => (process.env.FRONTEND_URL || "https://bool-me-neon.vercel.app").replace(/\/$/, "");

export const getGoogleConnectUrl = async (req , res) =>{
    if(!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI){
        return res 
        .status(StatusCodes.BAD_GATEWAY)
        .json({message:"Google Calendar is not config!!!"})
    };

    const state = jwt.sign(
      { userId: req.user.id.userId, purpose: "google-calendar" },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "10m" },
    );
    res.json({url:getGoogleAuthURI(state)});
};


export const handleGoogleCallback = async (req , res) =>{
    try {
        const {code ,state} = req.query;
        if(!code || !state){
            return res.redirect(`${frontendUrl()}/profile?calendar=failed`)
        }
        const decodedState = jwt.verify(state, process.env.JWT_SECRET_KEY);
        if (decodedState?.purpose !== "google-calendar" || !decodedState?.userId) {
          return res.redirect(`${frontendUrl()}/profile?calendar=failed`);
        }
        const token = await getGoogleTokens(code);
        if(!token.refresh_token){
            const user = await User.findById(decodedState.userId).select("googleRefreshToken googleRefereshToken");
            if (!(user?.googleRefreshToken || user?.googleRefereshToken)) {
              return res.redirect(`${frontendUrl()}/profile?calendar=missing-refresh-token`);
            }
        }

        const update = {
          googleCalendarConnected:true,
          googleCalenderConnected:true,
          googleCalendarId:"primary",
          googleCalenderId:"primary",
        };
        if (token.refresh_token) {
          update.googleRefreshToken = token.refresh_token;
          update.googleRefereshToken = token.refresh_token;
        }
        await User.findByIdAndUpdate(decodedState.userId, update);
        res.redirect(`${frontendUrl()}/profile?calendar=connected`)
    } catch (error) {
         res.redirect(`${frontendUrl()}/profile?calendar=failed`)
    }
}
