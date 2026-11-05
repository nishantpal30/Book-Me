import client from "./client";


export const getgoogleConnectUrl =() => client.get("/calendar/google/connect");
