export const PLATFORM_FEE_RATE = 0.1;

export const calculatePlatformFee = (amount) =>{
    const safeamount = Number.isFinite(amount) ? Math.max(0,Math.round(amount)) :0;
    const platformfee = Math.round(safeamount*PLATFORM_FEE_RATE);
    const providePayoutAmount = Math.max(0,safeamount-platformfee);

    return {
        platformFeeAmount: platformfee,
        providerPayoutAmount: providePayoutAmount,
    }
};

export const formatMinorMoney = (amount,currency="inr") =>{
    return new Intl.NumberFormat("en-IN",{
        style:"currency",
        currency:currency.toUpperCase(),
    }).format((amount || 0)/100);
}
