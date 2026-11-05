import Availability from "../db/models/avalability.js";
import Booking from "../db/models/booking.js";
import { timeOverlap } from "../utils/overlap.js";
import { getDayofWeek ,minutesTotime,timeTOminutes} from "../utils/time.js";
import { isFutureLocalSlot } from "../utils/localDate.js";

export const generateSlots = async ({userId,service,date,timeZone})=>{
    const dayofWeek = getDayofWeek(date);
    // console.log(dayofWeek)
    const availability = await Availability.findOne({userId,dayofWeek});
    // console.log(availability)
    if(!availability || availability.slots.length===0){
        return [];
    };
    const bookings = await Booking.find({
        userId,
        date,
        $or:[
            {status:"confirmed"},
            {
                status:"pending_payment",
                createdAt:{$gte:new Date(Date.now()-30*60*1000)},
            },
        ],

    });
    // console.log(bookings)
//     console.log({
//         name:"okk",
//   slotWindows: availability?.slots?.length,
//   duration: service.duration,
//   durationType: typeof service.duration,
//   firstWindow: availability?.slots?.[0],
//   bookingsCount: bookings.length,
// });

    const slots = [];
    availability.slots.forEach((window)=> { 
        
//   console.log("WINDOW", {
//     raw: window,
//     cursor,
//     end,
//     duration: service.duration,
//     durationType: typeof service.duration,
//     iterations: Math.floor((end - cursor) / service.duration),
//   });
        let cursor = timeTOminutes(window.startTime);
        // console.log(cursor)
        const end = timeTOminutes(window.endTime);
        while(cursor+service.duration <= end){
            const startTime = minutesTotime(cursor);
            const endTime = minutesTotime(cursor + service.duration);
            if (!isFutureLocalSlot(date, startTime, timeZone)) {
                cursor += service.duration;
                continue;
            }
            const hasconflict = bookings.some((booking)=>{
               return timeOverlap(startTime,endTime,booking.startTime,booking.endTime)
            });
            if(!hasconflict){
                slots.push({startTime,endTime});
            }
            cursor +=service.duration;
        }
    }) ;
    return slots;

   
}
