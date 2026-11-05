import client from "./client";

export const getPublicBusiness = (slug) => client.get(`/public/${slug}`);
export const getPublicSlots = (slug, params) =>
  client.post(`/public/${slug}/slots`, params);
export const requestPublicBookingOtp = (slug, customerEmail) =>
  client.post(`/public/${slug}/otp/request`, { customerEmail });
export const verifyPublicBookingOtp = (slug, data) =>
  client.post(`/public/${slug}/otp/verify`, data);

export const createPublicBooking = (slug, data) =>
  client.post(`/public/${slug}/book`, data);
export const verifyPublicBookingPayment = (slug, data) =>
  client.post(`/public/${slug}/payment/verify`, data);


export const getPublicBookingStatus = (params) =>
  client.get(`/public/booking/status`, { params });

export const cancelPublicBookingPayments = (bookingId) =>
  client.post(`/public/booking/payment/cancel`, { booking_id: bookingId });
