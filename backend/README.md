# BookMe backend

Express and MongoDB API for BookMe. From this folder, run `npm install`, then `npm run dev` for development or `npm start` for production.

## Runtime configuration

No environment file is included. Set these values in the hosting provider's secret/configuration settings or in the process environment:

| Variable | Required for | Notes |
| --- | --- | --- |
| `DATABASE_URI` | API startup | MongoDB connection string |
| `JWT_SECRET_KEY` | User login and Google OAuth state | Use a long, random secret |
| `ADMIN_EMAIL` | Admin login | Dedicated admin account email |
| `ADMIN_PASSWORD` | Admin login | Dedicated strong password |
| `ADMIN_JWT_SECRET` | Admin API | Keep separate from the user JWT secret |
| `FRONTEND_URL` | CORS and Google callback redirect | Frontend origin, with no trailing slash |
| `GOOGLE_CLIENT_ID` | Google Calendar | OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google Calendar | OAuth client secret |
| `GOOGLE_REDIRECT_URI` | Google Calendar | Backend callback URL: `/api/calendar/google/callback` |
| `RAZORPAY_KEY_ID` | Paid bookings | Razorpay public key ID |
| `RAZORPAY_KEY_SECRET` | Paid bookings | Razorpay key secret |
| `BREVO_API_KEY` | Booking email | Brevo API key |
| `BREVO_SENDER_EMAIL` | Booking email | Verified sender; `EMAIL_FROM` is accepted as a fallback |
| `BREVO_SENDER_NAME` | Booking email | Optional display name |
| `PORT` | API startup | Optional; defaults to `3001` |

The Google OAuth client must allow the exact callback URI configured in `GOOGLE_REDIRECT_URI`. Google Calendar and Razorpay features return a clear configuration error when their credentials are missing. Email notifications are skipped when Brevo is not configured.

## Admin API

All admin routes are under `/api/admin`. `POST /login` checks `ADMIN_EMAIL` and `ADMIN_PASSWORD` and returns a short-lived bearer token. The dashboard, booking list/status/reschedule endpoints, and withdrawal status endpoint require that token.

- `GET /dashboard`
- `GET /bookings?page=1&limit=30&status=all`
- `PATCH /bookings/:id/status` with `{ "status": "confirmed" | "cancelled" }`
- `PATCH /bookings/:id/reschedule` with `{ "date", "startTime", "endTime" }`
- `PATCH /withdrawals/:id/status` with `{ "status": "processing" | "paid" | "rejected", "adminNote"? }`

`processing` accepts a pending withdrawal for payout processing. Rejections release the reserved wallet amount. Confirmed bookings can be rescheduled only within the provider's saved availability and for the service's configured duration.
