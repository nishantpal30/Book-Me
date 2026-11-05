

export const toUserResponse = (user) => {
  if (!user) return null;

  return {
    id: user._id,
    name: user.name,
    email: user.email,

    businessName: user.businessName,
    businessDescription: user.businessDescription || user.businessDiscription || "",
    businessDiscription: user.businessDescription || user.businessDiscription || "",
    timeZone: user.timeZone || user.timezone || "Asia/Kolkata",
    timezone: user.timeZone || user.timezone || "Asia/Kolkata",
    googleCalendarConnected: Boolean(user.googleCalendarConnected || user.googleCalenderConnected),

    brandTheme: user.brandTheme,
    brandAccent: user.brandAccent,

    slug: user.slug,

    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};
