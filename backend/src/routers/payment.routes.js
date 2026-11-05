import express from "express";
import isAuthenticated from "../middlewares/isauth.middleware.js";
import { getPaymentOverview, requestWithdrawal, updatePayoutDetails } from "../controllers/payment.controller.js";

const paymentRoutes = express.Router();

paymentRoutes.get("/",isAuthenticated,getPaymentOverview);
paymentRoutes.put("/payout-details",isAuthenticated,updatePayoutDetails);
paymentRoutes.post("/withdrawals",isAuthenticated,requestWithdrawal);

export default paymentRoutes;
