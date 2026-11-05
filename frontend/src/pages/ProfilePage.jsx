import { useEffect,useState, } from "react";
import {useSearchParams} from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { getMe,updateProfile } from "../api/auth";
import {getgoogleConnectUrl} from "../api/integration";
import { Copy,BadgeCheck,Users,Globe,Save,Wand2,CalendarDays,Shield,BellRing,Zap,Clock,IndianRupee,QrCode,Share2,ExternalLink,X } from "lucide-react";
import googleCalendarLogo from "../assets/Google_Calendar-Logo.wine.png";
import gmailLogo from "../assets/gmail.webp";
import p2Image from "../assets/P2.png";
import greenBanner from "../assets/green.png";
import purpleBanner from "../assets/purple.png";
import redBanner from "../assets/red.png";
import whiteBanner from "../assets/white.png";
import yellowBanner from "../assets/yellow.png";
// import stripeLogo from "../assets/stripeicon.jpeg";
import razorpay from "../assets/razorpay.svg";
import { brandThemeOptions,getBrandThemeStyle,profilePageStyles as s } from "../utils/dummystyle";
import Cookies from "js-cookie";

const getCalendarMessage = (value) =>{
    if(value === "connected") return "Google Calendar connected successfully";
    if(value) return "Google Calendar connection was not Completed";
    return " ";
};

const themeBannerImages = {
    emerald : greenBanner,
    indigo:purpleBanner,
    rose:redBanner,
    amber:yellowBanner,
    slate:whiteBanner,
}

export default function ProfilePage(){
const [searchParams] = useSearchParams();
const calendarNotice = searchParams.get("calendar");
const [form,setForm] = useState({
    businessName:"",
    businessDescription:"",
    timezone:"Asia/Kolkata",
    brandTheme:"emerald",
    brandAccent:"#6C47FF",
});
const [user,setUser] = useState(null);
const [loading,setLoading] =useState(false);
const [connectingCalendar,setConnectingCalendar] = useState(false);
const [message,setMessage] = useState(getCalendarMessage(calendarNotice));
const [copyMessage,setCopyMessage] = useState("");
const [showPublicQr,setShowPublicQr] = useState(false);

const publicLink = user?.slug ? `${window.location.origin}/p/${encodeURIComponent(user.slug)}` : "";
const publicQrImage = publicLink
  ? `https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=14&data=${encodeURIComponent(publicLink)}`
  : "";
const dynamicThemeUI = getBrandThemeStyle(form.brandTheme);
const brandStyleVars = {
    "--brand-accent":form.brandAccent || dynamicThemeUI.accent,
    "--brand-panel":dynamicThemeUI.panel,
};
const previewBannerImage = themeBannerImages[form.brandTheme] || greenBanner;

  useEffect(() => {
    const loadUser = async () => {
      if (!Cookies.get("token")) {
        setMessage("Please log in before editing your profile");
        return;
      }

      try {
        const { data } = await getMe();
        // console.log(data)
        const nextUser = data?.user;

        if (!nextUser) {
          setMessage("Could not load profile details");
          return;
        }

        setUser(nextUser);
        setForm({
          businessName: nextUser.businessName || "Mental Clinic",
          businessDescription: nextUser.businessDescription || "",
          timezone: nextUser.timezone || "Asia/Kolkata",
          brandTheme: nextUser.brandTheme || "emerald",
          brandAccent: nextUser.brandAccent || "#6C47FF",
        });
      } catch (error) {
        setMessage(
          error.response?.data?.message || "Could not load profile details",
        );
      }
    };

    loadUser();
  }, []);

  const handleChange = (event) => {
    setForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const chooseTheme = (theme) => {
    setForm((prev) => ({
      ...prev,
      brandTheme: theme.id,
      brandAccent: theme.accent,
    }));
  };

  const copyPublicLink = async () => {
    if (!publicLink) return;
    try {
      await navigator.clipboard.writeText(publicLink);
      setCopyMessage("Copied!");
      window.setTimeout(() => setCopyMessage(""), 1800);
    } catch {
      setCopyMessage("Copy unavailable");
    }
  };

  const sharePublicProfile = async () => {
    if (!publicLink) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${form.businessName || user?.name || "Business"} on BookMe`,
          text: "View services and book an appointment.",
          url: publicLink,
        });
        setCopyMessage("Profile shared");
      } else {
        await navigator.clipboard.writeText(publicLink);
        setCopyMessage("Link copied");
      }
      window.setTimeout(() => setCopyMessage(""), 1800);
    } catch (error) {
      if (error.name !== "AbortError") setCopyMessage("Could not share profile");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!Cookies.get("token")) {
      setMessage("Please log in before editing your profile");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const { data } = await updateProfile(form);
      setUser(data.user);
      setMessage("Profile updated successfully");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const connectGoogleCalendar = async () => {
    setConnectingCalendar(true);
    setMessage("");

    try {
      const { data } = await getGoogleConnectUrl();
      window.location.href = data.url;
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Could not start Google Calendar connection",
      );
      setConnectingCalendar(false);
    }
  };

  const getMessageBannerClass = (msg) => {
    if (!msg) return "";
    return msg.toLowerCase().includes("success") || msg.includes("updated")
      ? s.messageBannerSuccess
      : s.messageBannerError;
  };

  return (
    <AppLayout>
      <div className={s.pageLayout}>
        {/* LEFT COLUMN */}
        <div className={s.leftColumn}>
          {/* Header & Illustration */}
          <div className={s.headerRow}>
            <div className={s.headerTextBlock}>
              <h3 className={s.profileLabel}>Profile</h3>
              <h1 className={s.mainHeading}>
                Shape your{" "}
                <span className={s.headingGradientPublic}>public</span>
                <br />
                <span className={s.headingGradientBooking}>
                  booking{" "}
                  <span className={s.headingGradientBookingInner}>
                    experience
                  </span>
                </span>
              </h1>
              <p className={s.subHeading}>
                Personalize your booking page, connect your tools, and share
                your link with confidence.
              </p>
            </div>
            <div className={s.illustrationContainer}>
              <img
                src={p2Image}
                alt="Profile illustration"
                className={s.illustrationImg}
              />
            </div>
          </div>

          {/* Public Profile Share Card */}
          <div className={s.linkCard}>
            <h4 className={s.linkCardTitle}>Public business profile</h4>
            <div className={s.linkRow}>
              <div className={s.linkBar}>
                {publicLink ? (
                  <a href={publicLink} target="_blank" rel="noreferrer" className={s.linkText}>
                    {publicLink}
                  </a>
                ) : (
                  <span className={s.linkText}>Save your profile to create a share link</span>
                )}
                <button
                  type="button"
                  onClick={copyPublicLink}
                  className={s.linkCopyButtonSmall}
                  disabled={!publicLink}
                  aria-label="Copy public profile link"
                >
                  <Copy className={s.iconSmall} />
                </button>
              </div>
              <button onClick={copyPublicLink} disabled={!publicLink} className={s.linkCopyButtonMain}>
                <Wand2 className={s.iconSmall} />
                {copyMessage || "Copy link"}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={sharePublicProfile}
                disabled={!publicLink}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Share2 className={s.iconSmall} /> Share profile
              </button>
              <button
                type="button"
                onClick={() => setShowPublicQr(true)}
                disabled={!publicLink}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <QrCode className={s.iconSmall} /> Show QR code
              </button>
              {publicLink && (
                <a href={publicLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  <ExternalLink className={s.iconSmall} /> Preview
                </a>
              )}
            </div>
            <div className={s.linkLiveIndicator}>
              <BadgeCheck className={s.iconSmall} />
              <span>Share the profile link or QR code so customers can browse your services and book.</span>
            </div>
          </div>

          {/* Integrations Grid */}
          <div className={s.integrationsGrid}>
            {/* Razorpay */}
            <div className={s.integrationCard}>
              <div className={s.integrationHeader}>
                <div className={s.integrationLogoBox}>
                  <img
                    src={razorpay}
                    alt="Razorpay"
                    className={s.integrationLogoImg}
                  />
                </div>
                <span className={s.integrationLabel}>Razorpay</span>
              </div>
              <h4 className={s.integrationStatusConfigured}>
                Configured <BadgeCheck className={s.integrationCheckIcon} />
              </h4>
              <p className={s.integrationDesc}>
                Collect payments securely via Razorpay.
              </p>
              <div className={s.integrationInfoPill}>
                Platform payment gateway
              </div>
            </div>

            {/* Google Calendar */}
            <div className={s.integrationCard}>
              <div className={s.integrationHeader}>
                <div className={s.integrationLogoBox}>
                  <img
                    src={googleCalendarLogo}
                    alt="Calendar"
                    className={s.integrationLogoImg}
                  />
                </div>
                <span className={s.integrationLabel}>Calendar</span>
              </div>
              <h4 className={s.integrationStatusConnected}>
                Connected <BadgeCheck className={s.integrationCheckIcon} />
              </h4>
              <p className={s.integrationDesc}>
                Bookings will sync automatically.
              </p>
              <button
                onClick={connectGoogleCalendar}
                disabled={connectingCalendar}
                className={s.integrationManageButton}
              >
                {connectingCalendar ? "Wait..." : "Manage"}
              </button>
            </div>

            {/* Email Notifications */}
            <div className={s.integrationCard}>
              <div className={s.integrationHeader}>
                <div className={s.integrationLogoBox}>
                  <img
                    src={gmailLogo}
                    alt="Emails"
                    className={s.integrationLogoImg}
                  />
                </div>
                <span className={s.integrationLabel}>Emails</span>
              </div>
              <h4 className={s.integrationStatusConfigured}>
                Configured <BadgeCheck className={s.integrationCheckIcon} />
              </h4>
              <p className={s.integrationDesc}>
                Customers receive email updates.
              </p>
              <div className={s.integrationInfoPill}>
                Automatic booking emails
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className={s.rightColumn}>
          <div className={s.formHeader}>
            <div className={s.formHeaderIcon}>
              <Users className={s.formHeaderUserIcon} />
            </div>
            <div>
              <h2 className={s.formTitle}>Business details</h2>
              <p className={s.formSubtitle}>Update your profile info</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className={s.form}>
            {/* Business Name */}
            <div>
              <label className={s.inputLabel}>Business Name</label>
              <div className={s.inputWrapper}>
                <input
                  name="businessName"
                  value={form.businessName}
                  onChange={handleChange}
                  className={s.textInput}
                />
                <Globe className={s.inputIconRight} />
              </div>
            </div>

            {/* Business Description */}
            <div>
              <label className={s.inputLabel}>Business Description</label>
              <textarea
                name="businessDescription"
                value={form.businessDescription}
                onChange={handleChange}
                rows={3}
                className={s.textareaInput}
              />
            </div>

            <div className={s.twoColGrid}>
              {/* Timezone */}
              <div>
                <label className={s.inputLabel}>Timezone</label>
                <div className={s.inputWrapper}>
                  <Globe className={s.inputIconLeft} />
                  <select
                    name="timezone"
                    value={form.timezone}
                    onChange={handleChange}
                    className={s.selectInput}
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York</option>
                  </select>
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className={s.inputLabel}>Accent color</label>
                <div className={s.colorInputRow}>
                  <input
                    name="brandAccent"
                    type="color"
                    value={form.brandAccent}
                    onChange={handleChange}
                    className={s.colorPicker}
                  />
                  <input
                    type="text"
                    value={form.brandAccent.toUpperCase()}
                    onChange={handleChange}
                    className={s.colorTextInput}
                  />
                </div>
              </div>
            </div>

            {/* Theme */}
            <div>
              <label className={s.inputLabel}>Theme</label>
              <div className={s.themeSwatches}>
                {brandThemeOptions.map((theme) => {
                  const isSelected = form.brandTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => chooseTheme(theme)}
                      className={
                        isSelected ? s.themeBtnActive : s.themeBtnInactive
                      }
                    >
                      <span className={`${s.themeSwatch} ${theme.swatch}`} />
                      {theme.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Save Button */}
            <button type="submit" disabled={loading} className={s.saveButton}>
              <Save className={s.saveButtonIcon} />
              {loading ? "Saving..." : "Save profile settings"}
            </button>
            {message && (
              <div
                className={`${s.messageBanner} ${getMessageBannerClass(
                  message,
                )}`}
              >
                <BadgeCheck className={s.messageBannerIcon} />
                {message}
              </div>
            )}
          </form>
        </div>

        {/* BOTTOM FULL WIDTH AREA (Preview + Customer View) */}
        <div className={s.bottomFullWidth} style={brandStyleVars}>
          {/* Public Preview Block */}
          <div className={s.previewContainer}>
            <div className={s.previewBanner}>
              <div className={s.previewBannerBg}>
                <img
                  src={previewBannerImage}
                  alt="3D Illustration"
                  className={s.previewBannerImg}
                  style={{
                    WebkitMaskImage:
                      "linear-gradient(to right, transparent, black 80%)",
                    maskImage:
                      "linear-gradient(to right, transparent, black 80%)",
                  }}
                />
                <div className={s.previewBannerOverlay} />
              </div>

              <div className={s.previewBannerContent}>
                <div className={s.previewAvatarRow}>
                  <div className={s.previewAvatar}>
                    {(form.businessName || "M").slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className={s.previewLabel}>Public preview</div>
                    <h2 className={s.previewTitle}>
                      {form.businessName || "Mental Clinic"}
                    </h2>
                  </div>
                </div>
                {form.businessDescription && (
                  <p className={s.previewDesc}>{form.businessDescription}</p>
                )}
              </div>
            </div>

            {/* Overlapping White feature card */}
            <div className={s.previewFeatureCard}>
              <div className={s.featureItem}>
                <div className={s.featureIconBox}>
                  <CalendarDays className={s.featureIcon} />
                </div>
                <div>
                  <h5 className={s.featureTitle}>Easy Booking</h5>
                  <p className={s.featureText}>
                    Book your session in just a few clicks.
                  </p>
                </div>
              </div>
              <div className={s.featureItem}>
                <div className={s.featureIconBox}>
                  <Shield className={s.featureIcon} />
                </div>
                <div>
                  <h5 className={s.featureTitle}>Secure Payments</h5>
                  <p className={s.featureText}>
                    Powered by Razorpay for safe transactions.
                  </p>
                </div>
              </div>
              <div className={s.featureItem}>
                <div className={s.featureIconBox}>
                  <BellRing className={s.featureIcon} />
                </div>
                <div>
                  <h5 className={s.featureTitle}>Instant Updates</h5>
                  <p className={s.featureText}>
                    Get email & calendar reminders.
                  </p>
                </div>
              </div>
              <div className={s.featureItem}>
                <div className={s.featureIconBox}>
                  <Zap className={s.featureIcon} />
                </div>
                <div>
                  <h5 className={s.featureTitle}>Hassle-free</h5>
                  <p className={s.featureText}>
                    Manage bookings anytime, anywhere.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer View Section */}
          <div className={s.customerViewContainer}>
            <div className={s.customerViewLabel}>Customer view</div>

            <div className={`${s.customerViewCard} ${dynamicThemeUI.bg}`}>
              <div
                className={`${s.customerViewOverlay} ${dynamicThemeUI.gradient}`}
              />
              <div className={s.customerViewContent}>
                <div
                  className={s.customerAvatar}
                  style={{ backgroundColor: form.brandAccent }}
                >
                  {(form.businessName || "M").slice(0, 1).toUpperCase()}
                </div>
                <h3 className={s.customerName}>
                  {form.businessName || "Mental Clinic"}
                </h3>
                <div className={s.customerMeta}>
                  <span className={s.customerMetaItem}>
                    <Clock className={s.customerMetaIcon} /> 60 min
                  </span>
                  <span className={s.customerMetaItem}>
                    <IndianRupee className={s.customerMetaIcon} />{" "}
                    {form.duration || 900}
                  </span>
                </div>
                <div className={s.customerTimeslotSection}>
                  <div className={s.timeslotLabel}>Select Time</div>
                  <button
                    className={s.timeslotActiveBtn}
                    style={{ backgroundColor: form.brandAccent }}
                  >
                    10:00 AM
                  </button>
                  <button className={s.timeslotInactiveBtn}>11:30 AM</button>
                </div>
              </div>
            </div>

            <div className={s.customerViewHint}>
              <Wand2 className={s.hintIcon} />
              <span>
                Preview your public booking page.
                <br />
                Accent color applies to buttons.
              </span>
            </div>
          </div>
        </div>
      </div>
      {showPublicQr && publicLink && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowPublicQr(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-qr-title"
            className="relative w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setShowPublicQr(false)}
              aria-label="Close QR code"
              className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={18} />
            </button>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
              <QrCode size={22} />
            </div>
            <h2 id="profile-qr-title" className="mt-3 text-lg font-extrabold text-slate-900">
              Share your public profile
            </h2>
            <p className="mt-1 text-sm text-slate-500">Customers can scan this code to view your services and book.</p>
            <img
              src={publicQrImage}
              alt={`QR code linking to ${publicLink}`}
              className="mx-auto mt-5 h-56 w-56 rounded-xl border border-slate-100 bg-white p-2"
            />
            <a
              href={publicQrImage}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-violet-700 underline"
            >
              Open or save QR image <ExternalLink size={13} />
            </a>
            <p className="mt-3 break-all rounded-xl bg-slate-50 p-3 text-xs font-medium text-slate-600">{publicLink}</p>
            <button
              type="button"
              onClick={copyPublicLink}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-700"
            >
              <Copy size={16} /> {copyMessage || "Copy profile link"}
            </button>
          </section>
        </div>
      )}
    </AppLayout>
  );
}
