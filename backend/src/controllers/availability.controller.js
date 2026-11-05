import Availability from "../db/models/avalability.js";
import { StatusCodes } from "http-status-codes";
import { isValidTimeRange } from "../utils/time.js";

export const listAvailabilty = async (req, res) => {
  try {
    const availability = await Availability.find({
      userId: req.user?.id?.userId,
    }).sort({
      dayofWeek: 1,
    });

    return res.status(StatusCodes.OK).json({
      availability,
      success: true,
    });
  } catch (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: error.message,
      success: false,
    });
  }
};

export const saveAvailability = async (req, res) => {
  try {
    const dayofWeek = Number(req.body.dayofWeek);
    const { slots } = req.body;

    if (!Number.isInteger(dayofWeek) || dayofWeek < 0 || dayofWeek > 6) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Valid day of week is required",
      });
    }

    if (!Array.isArray(slots)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "Slots must be a list" });
    }
    const cleanedSlots = slots.map((slot) => ({
      startTime: String(slot?.startTime || ""),
      endTime: String(slot?.endTime || ""),
    }));
    if (cleanedSlots.some((slot) => (
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.startTime) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.endTime) ||
      !isValidTimeRange(slot.startTime, slot.endTime)
    ))) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "Every time window must have valid start and end times" });
    }
    cleanedSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
    for (let index = 1; index < cleanedSlots.length; index += 1) {
      if (cleanedSlots[index].startTime < cleanedSlots[index - 1].endTime) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: "Availability windows cannot overlap" });
      }
    }

    const availability = await Availability.findOneAndUpdate(
      { userId: req.user?.id?.userId, dayofWeek },
      { slots: cleanedSlots },
      { returnDocument: "after", upsert: true },
    );

    return res.json({ message: "Availability saved", availability });
  } catch (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: error.message,
      success: false,
    });
  }
};
