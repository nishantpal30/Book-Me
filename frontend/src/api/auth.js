import client from "./client";

export const register = (data)=> client.post("/auth/register",data);
export const requestRegisterOTP = (email)=> client.post("/auth/register/request-otp",{email});
export const verifyRegisterOTP = (data) => client.post("/auth/register/verify-otp",data);
export const login = (data) => client.post("/auth/login",data);
export const getMe = (data)=>client.get("/auth/me",data);
export const updateProfile = (data) => client.put("/auth/profile",data);
