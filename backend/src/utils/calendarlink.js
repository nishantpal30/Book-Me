import { normalizeTimeZone } from "./localDate.js";

const toGoogleDateTime = (date,time) => `${date.replaceAll("-", "")}T${time.replace(":", "")}00`;

export const buildCustomerCalendar = ({business,service,booking}) =>{
    const params = new URLSearchParams({
        action:"TEMPLATE",
        text:`${service.name} with ${business.businessName || business.name}`,
        dates:`${toGoogleDateTime(booking.date,booking.startTime)}/${toGoogleDateTime(booking.date,booking.endTime)}`,
        ctz: normalizeTimeZone(business.timeZone || business.timezone),

    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
