import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, CalendarDays, Clock3, Sparkles } from "lucide-react";
import { getPublicProfile } from "../api/public";

const themeBackgrounds = {
  emerald: "from-emerald-950 via-emerald-900 to-teal-800",
  indigo: "from-indigo-950 via-indigo-900 to-violet-800",
  rose: "from-rose-950 via-rose-900 to-pink-800",
  amber: "from-amber-950 via-amber-900 to-orange-800",
  slate: "from-slate-950 via-slate-900 to-slate-700",
};

const formatPrice = (price) => {
  const amount = Number(price) || 0;
  if (amount === 0) return "Free";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function PublicProfilePage() {
  const { slug } = useParams();
  const [profile, setProfile] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    getPublicProfile(slug)
      .then(({ data }) => {
        if (!active) return;
        setProfile(data.profile || null);
        setServices(data.services || []);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(
          requestError.response?.data?.message ||
            "This public profile could not be loaded.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 text-sm font-semibold text-slate-500">
        Loading public profile…
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-extrabold text-slate-900">
            Profile unavailable
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error || "This public profile could not be found."}
          </p>
          <Link
            to="/login"
            className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
          >
            Go to BookMe
          </Link>
        </div>
      </main>
    );
  }

  const accent = /^#(?:[\da-f]{3}){1,2}$/i.test(profile.brandAccent || "")
    ? profile.brandAccent
    : "#047857";
  const background = themeBackgrounds[profile.brandTheme] || themeBackgrounds.emerald;

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-5 flex items-center justify-between px-1">
          <Link to="/login" className="text-lg font-black tracking-tight text-slate-900">
            BookMe<span className="text-violet-600">.</span>
          </Link>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-500">
            Public profile
          </span>
        </header>

        <section
          className={`relative overflow-hidden rounded-[28px] bg-gradient-to-br ${background} px-6 py-10 text-white shadow-xl sm:px-10 sm:py-14`}
        >
          <div className="pointer-events-none absolute -right-12 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="relative max-w-3xl">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-2xl font-black shadow-inner">
              {(profile.name || "B").trim().slice(0, 1).toUpperCase()}
            </div>
            <p className="mt-7 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.2em] text-white/70">
              <Sparkles size={15} aria-hidden="true" />
              Book an appointment
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
              {profile.name}
            </h1>
            <p className="mt-2 text-sm font-semibold text-white/65">@{profile.slug}</p>
            {profile.description && (
              <p className="mt-5 max-w-2xl whitespace-pre-wrap text-base leading-7 text-white/80">
                {profile.description}
              </p>
            )}
            <a
              href="#services"
              className="mt-8 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5"
              style={{ backgroundColor: accent }}
            >
              Browse services <ArrowRight size={17} aria-hidden="true" />
            </a>
          </div>
        </section>

        <section id="services" className="scroll-mt-6 py-10 sm:py-12">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">
                What we offer
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Available services
              </h2>
            </div>
            <p className="text-sm font-semibold text-slate-500">
              {services.length} {services.length === 1 ? "service" : "services"}
            </p>
          </div>

          {services.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {services.map((service) => (
                <article
                  key={service._id}
                  className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_-28px_rgba(15,23,42,0.35)] sm:p-6"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
                      style={{ backgroundColor: accent }}
                    >
                      <CalendarDays size={21} aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-extrabold text-slate-900">
                        {service.name}
                      </h3>
                      {service.description && (
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-500">
                          {service.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <div>
                      <p className="text-base font-black text-slate-900">
                        {formatPrice(service.price)}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                        <Clock3 size={14} aria-hidden="true" />
                        {service.duration} minutes
                      </p>
                    </div>
                    <Link
                      to={`/book/${encodeURIComponent(profile.slug)}?service=${encodeURIComponent(service._id)}`}
                      className="inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold text-white transition hover:brightness-95"
                      style={{ backgroundColor: accent }}
                    >
                      Book now <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <h3 className="font-bold text-slate-800">No services available yet</h3>
              <p className="mt-2 text-sm text-slate-500">
                Please check back later for available appointments.
              </p>
            </div>
          )}
        </section>

        <footer className="border-t border-slate-200 py-6 text-center text-xs font-medium text-slate-400">
          Booking page powered by BookMe
        </footer>
      </div>
    </main>
  );
}
