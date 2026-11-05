import WalletTransaction from "../db/models/walletTransaction.js";
import Withdrawal from "../db/models/withdrawl.js";

export const bookingPayouttransation = async ({booking,description})=>{
    if(!booking?.providerPayoutAmount) {
        return null;
    };
    const existing = await WalletTransaction.findOne({
        bookingId: booking._id,
        type: { $in: ["booking_payout", "bookin_payout"] },
    });
    if (existing) return existing;
    try {
        const walletTransation_Details = await WalletTransaction.create({
            userId:booking.userId || booking.user?.id,
            bookingId:booking._id,
            type:"booking_payout",
            amount:booking.providerPayoutAmount,
            currency:booking.currency,
            status:"available",
            description:description || "Booking payout after platform fee cut!!",
        });
        return walletTransation_Details;
    } catch (error) {
        if(error.code ===11000){
            return WalletTransaction.findOne({bookingId:booking._id,type:{$in:["booking_payout","bookin_payout"]}});
        }
        throw error;
    }

};

export const getWalletSummary = async (userId) =>{
const [rows , withdrawalRows] = await Promise.all([
    WalletTransaction.aggregate([
        {$match:{userId}},
        {
            $group:{
                _id:`$type`,
                total:{$sum:`$amount`},
            },
        },
    ]),
    Withdrawal.aggregate([
        {$match:{userId}},
        {
            $group:{
                _id:`$status`,
                total:{$sum:`$amount`},
            }
        }
    ])
])
const totals = rows.reduce((acc,row)=>{
    const aliases = {
        bookin_payout:"booking_payout",
        withdrawl_hold:"withdrawal_hold",
        withdrawl_reversal:"withdrawal_reversal",
    };
    const key = aliases[row._id] || row._id;
    acc[key] = (acc[key] || 0) + row.total;
    return acc;
},{});
const withdrawalTotals = withdrawalRows.reduce((acc,row)=>({...acc,[row._id]:row.total}),{});
const earned = totals.booking_payout || 0;
const pendingWithdrawals = (withdrawalTotals.pending || 0)+(withdrawalTotals.processing || 0);
const paidWithdrawals = withdrawalTotals.paid || 0;
const reservedBalance = pendingWithdrawals + paidWithdrawals;

return {
    earned,
    withdrawalHolds:pendingWithdrawals,
    pendingWithdrawals,
    paidWithdrawals,
    available : Math.max(0,earned - reservedBalance),
}
    
};
