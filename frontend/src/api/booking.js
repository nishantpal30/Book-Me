import client from "./client";
export const listBooking = (params = {}) => client.get("/booking", { params });
export const updateBookingStatus = (id, status) =>
  client.patch(`/booking/${id}/status`, { status });
export const rescheduleBooking = (id, data) =>
  client.patch(`/booking/${id}/reschedule`, data);
