const safeTimeZone = (timeZone) => {
  const candidate = timeZone || "Asia/Kolkata";
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: candidate }).format(new Date());
    return candidate;
  } catch {
    return "Asia/Kolkata";
  }
};

export const normalizeTimeZone = safeTimeZone;

export const localDateString = (date = new Date(), timeZone = "Asia/Kolkata") =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: safeTimeZone(timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

export const isValidDateString = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

export const isFutureLocalSlot = (date, time, timeZone = "Asia/Kolkata") => {
  if (!isValidDateString(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(time || ""))) return false;
  const zone = safeTimeZone(timeZone);
  const today = localDateString(new Date(), zone);
  if (date > today) return true;
  if (date < today) return false;
  const now = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
  return time > now;
};
