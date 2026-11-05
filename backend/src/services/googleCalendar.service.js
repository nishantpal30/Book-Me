import { google } from "googleapis";
import { buildCustomerCalendar } from "../utils/calendarlink.js";
import { normalizeTimeZone } from "../utils/localDate.js";

const getOauthClient = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
};

// Generate Google OAuth authorization URL
export const getGoogleAuthURI = (state) => {
  const oauth2Client = getOauthClient();

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar.events"],
    state: String(state),
  });
};

const isCalendarConnected = (business) => Boolean(
  business.googleCalendarConnected || business.googleCalenderConnected,
);
const getRefreshToken = (business) => business.googleRefreshToken || business.googleRefereshToken;
const getCalendarId = (business) => business.googleCalendarId || business.googleCalenderId || "primary";
const getTimeZone = (business) => normalizeTimeZone(business.timeZone || business.timezone);

// Exchange authorization code for Google tokens
export const getGoogleTokens = async (code) => {
  const oauth2Client = getOauthClient();

  const { tokens } = await oauth2Client.getToken(code);

  return tokens;
};

// Create Google Calendar event for a booking
export const createBookingCalendarEvent = async ({
  business,
  service,
  booking,
}) => {
  const customerCalendarUrl = buildCustomerCalendar({
    business,
    service,
    booking,
  });

  // If Google Calendar isn't connected,
  // only return the customer calendar URL.
  if (!isCalendarConnected(business) || !getRefreshToken(business)) {
    return {
      customerCalendarUrl,
    };
  }

  const oauth2Client = getOauthClient();

  oauth2Client.setCredentials({
    refresh_token: getRefreshToken(business),
  });

  const calendar = google.calendar({
    version: "v3",
    auth: oauth2Client,
  });

  const summary = `${service.name} - ${booking.customerName}`;

  const description = [
    `Customer: ${booking.customerName}`,
    `Email: ${booking.customerEmail}`,
    booking.notes ? `Notes: ${booking.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const event = {
    summary,
    description,

    start: {
      dateTime: `${booking.date}T${booking.startTime}:00`,
      timeZone: getTimeZone(business),
    },

    end: {
      dateTime: `${booking.date}T${booking.endTime}:00`,
      timeZone: getTimeZone(business),
    },

    attendees: [
      {
        email: booking.customerEmail,
      },
    ],

    reminders: {
      useDefault: false,
      overrides: [
        {
          method: "email",
          minutes: 24 * 60,
        },
        {
          method: "popup",
          minutes: 30,
        },
      ],
    },
  };

  const { data } = await calendar.events.insert({
    calendarId: getCalendarId(business),
    resource: event,
    sendUpdates: "all",
  });

  return {
    googleEventId: data.id,
    customerCalendarUrl,
  };
};

// Update existing Google Calendar event
export const updateBookingCalendarEvent = async ({
  business,
  service,
  booking,
}) => {
  const customerCalendarUrl = buildCustomerCalendar({
    business,
    service,
    booking,
  });

  if (!isCalendarConnected(business) || !getRefreshToken(business)) {
    return {
      customerCalendarUrl,
    };
  }

  // If there is no Google event yet,
  // create one instead.
  if (!booking.googleEventId) {
    return createBookingCalendarEvent({
      business,
      service,
      booking,
    });
  }

  const oauth2Client = getOauthClient();

  oauth2Client.setCredentials({
    refresh_token: getRefreshToken(business),
  });

  const calendar = google.calendar({
    version: "v3",
    auth: oauth2Client,
  });

  const summary = `${service.name} - ${booking.customerName}`;

  const description = [
    `Customer: ${booking.customerName}`,
    `Email: ${booking.customerEmail}`,
    booking.notes ? `Notes: ${booking.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const event = {
    summary,
    description,

    start: {
      dateTime: `${booking.date}T${booking.startTime}:00`,
      timeZone: getTimeZone(business),
    },

    end: {
      dateTime: `${booking.date}T${booking.endTime}:00`,
      timeZone: getTimeZone(business),
    },

    attendees: [
      {
        email: booking.customerEmail,
      },
    ],

    reminders: {
      useDefault: false,
      overrides: [
        {
          method: "email",
          minutes: 24 * 60,
        },
        {
          method: "popup",
          minutes: 30,
        },
      ],
    },
  };

  let data;
  try {
    ({ data } = await calendar.events.update({
      calendarId: getCalendarId(business),
      eventId: booking.googleEventId,
      resource: event,
      sendUpdates: "all",
    }));
  } catch (error) {
    if ([404, 410].includes(error.code || error.response?.status)) {
      return createBookingCalendarEvent({ business, service, booking });
    }
    throw error;
  }

  return {
    googleEventId: data.id,
    customerCalendarUrl,
  };
};

// Cancel Google Calendar event
export const cancelBookingCalendarEvent = async ({ business, booking }) => {
  if (
    !isCalendarConnected(business) ||
    !getRefreshToken(business) ||
    !booking.googleEventId
  ) {
    return false;
  }

  const oauth2Client = getOauthClient();

  oauth2Client.setCredentials({
    refresh_token: getRefreshToken(business),
  });

  const calendar = google.calendar({
    version: "v3",
    auth: oauth2Client,
  });

  await calendar.events.patch({
    calendarId: getCalendarId(business),
    eventId: booking.googleEventId,
    resource: {
      status: "cancelled",
    },
    sendUpdates: "all",
  });

  return true;
};
