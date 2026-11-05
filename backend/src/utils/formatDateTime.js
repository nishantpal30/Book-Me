const formatDateTime = (booking) => {
  const date = new Date(`${booking.date}T00:00:00.000Z`);
  const displayDate = new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'full',
    timeZone: "UTC",
  }).format(date);

  return `${displayDate}, ${booking.startTime}-${booking.endTime}`;
};

export default formatDateTime;
