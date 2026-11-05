export const timeTOminutes = (time) =>{
    const [hours , minutes] = time.split(":").map(Number);
    return hours*60 + minutes;
};

export const minutesTotime = (totalMinutes)=>{
    const hours = Math.floor(totalMinutes/60);
    const minutes = totalMinutes%60;
    return `${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}`;

};

export const isValidTimeRange =(startTime,endTime)=>{
    return timeTOminutes(startTime)<timeTOminutes(endTime);
};
export const getDayofWeek = (date) => {
  return new Date(`${date}T00:00:00.000Z`).getUTCDay();
};
