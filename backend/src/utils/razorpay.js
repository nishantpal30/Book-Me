import Razorpay from "razorpay";

export const getrzp = () => {
  if (
    !process.env.RAZORPAY_KEY_ID ||
    !process.env.RAZORPAY_KEY_SECRET
  ) {
    return null;
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};
// console.log( "Rzp",getrzp)
export const toRzpAmount = (price) => {
  return Math.round(Number(price || 0) * 100);
};
