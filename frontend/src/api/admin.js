import client from "./client";

export const adminLogin = (credentials) => client.post("/admin/login", credentials);
export const getAdminDashboard = () => client.get("/admin/dashboard");
export const getAdminBookings = (params = {}) => client.get("/admin/bookings", { params });
export const updateAdminBookingStatus = (id, status) =>
  client.patch(`/admin/bookings/${id}/status`, { status });
export const rescheduleAdminBooking = (id, data) =>
  client.patch(`/admin/bookings/${id}/reschedule`, data);
export const updateWithdrawalStatus = (id, data) =>
  client.patch(`/admin/withdrawals/${id}/status`, data);
