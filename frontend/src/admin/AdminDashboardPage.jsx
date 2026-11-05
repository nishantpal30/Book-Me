import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  Wallet,
  TrendingUp,
  IndianRupee,
  Landmark,
  CheckCircle,
  XOctagon,
  Clock,
  UserCheck,
  ShieldCheck,
  CalendarDays,
} from "lucide-react";
import logo from "../assets/logo.png";
import { adminDashboardPageStyles as s } from "../utils/dummystyle";
import { formatMoney } from "../utils/formatMoney";
import {
  getAdminBookings,
  getAdminDashboard,
  rescheduleAdminBooking,
  updateAdminBookingStatus,
  updateWithdrawalStatus,
} from "../api/admin";

const withdrawalStatus = ["processing", "paid", "rejected"];
const terminalWithdrawalStatus = ["paid", "rejected"];

const isTerminalStatus = (status) => terminalWithdrawalStatus.includes(status);

const formatStatusLabel = (status = "") =>
  status ? `${status.slice(0, 1).toUpperCase()}${status.slice(1)}` : "";

// page design
const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [message, setMessage] = useState("");
  // updating withdrawal id
  const [updatepayout, setpayout] = useState("");
  // pending withdrawal action
  const [pendingpayout, setpendingpayout] = useState(null);
  const [adminBookings, setAdminBookings] = useState([]);
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
  const [bookingPage, setBookingPage] = useState(1);
  const [bookingPagination, setBookingPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [rescheduleDraft, setRescheduleDraft] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) {
      navigate("/admin/login");
      return undefined;
    }

    let isActive = true;

    getAdminDashboard()
      .then(({ data }) => {
        if (isActive) {
          setDashboard(data);
        }
      })
      .catch((error) => {
        if (isActive) {
          setMessage(
            error.response?.data?.message || "could not load admin dashboard",
          );
        }
      });

    return () => {
      isActive = false;
    };
  }, [navigate]);

  useEffect(() => {
    let isActive = true;
    getAdminBookings({ status: bookingStatusFilter, page: bookingPage, limit: 30 })
      .then(({ data }) => {
        if (isActive) {
          setAdminBookings(data.bookings || []);
          setBookingPagination(data.pagination || { page: 1, pages: 1, total: 0 });
        }
      })
      .catch((error) => { if (isActive) setMessage(error.response?.data?.message || "Could not load bookings"); });
    return () => { isActive = false; };
  }, [bookingStatusFilter, bookingPage]);

  const changeAdminBookingStatus = async (booking, status) => {
    try {
      const { data } = await updateAdminBookingStatus(booking._id, status);
      const { data: refreshedBookings } = await getAdminBookings({ status: bookingStatusFilter, page: bookingPage, limit: 30 });
      setAdminBookings(refreshedBookings.bookings || []);
      setBookingPagination(refreshedBookings.pagination || { page: 1, pages: 1, total: 0 });
      setMessage(data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not update booking");
    }
  };

  const saveAdminReschedule = async (event) => {
    event.preventDefault();
    if (!rescheduleDraft) return;
    try {
      const { data } = await rescheduleAdminBooking(rescheduleDraft.id, {
        date: rescheduleDraft.date,
        startTime: rescheduleDraft.startTime,
        endTime: rescheduleDraft.endTime,
      });
      const { data: refreshedBookings } = await getAdminBookings({ status: bookingStatusFilter, page: bookingPage, limit: 30 });
      setAdminBookings(refreshedBookings.bookings || []);
      setBookingPagination(refreshedBookings.pagination || { page: 1, pages: 1, total: 0 });
      setMessage(data.email?.skipped ? `${data.message}; email skipped: ${data.email.reason}` : data.message);
      setRescheduleDraft(null);
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not reschedule booking");
    }
  };

  const requestwithdrawalStatusChange = (withdrawal, status) => {
    if (withdrawal.status === status || isTerminalStatus(withdrawal.status)) {
      return;
    }
    setpendingpayout({ withdrawal, status });
  };

  const closewithdrawalConfirm = () => {
    if (updatepayout) return;
    setpendingpayout(null);
  };

  const changeWithdrawalStatus = async () => {
    if (!pendingpayout) return;

    const { withdrawal, status } = pendingpayout;
    setpayout(withdrawal._id);

    try {
      const { data } = await updateWithdrawalStatus(withdrawal._id, { status });
      const { data: refreshedDashboard } = await getAdminDashboard();

      setDashboard(refreshedDashboard);

      setMessage(data.message || `Withdrawal marked as ${status}`);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Could not update withdrawal",
      );
    } finally {
      setpayout("");
      setpendingpayout(null);
    }
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  const summary = dashboard?.summary || {};
  const pendingWithdrawal = pendingpayout?.withdrawal;
  const WithdrawalConfirmIcon =
    pendingpayout?.status === "rejected" ? XOctagon : ShieldCheck;
  const isConfirmingWithdrawal = Boolean(
    pendingWithdrawal && updatepayout === pendingWithdrawal._id,
  );

  // Helpers for dynamic classes from styles
  const getPayoutStatusClass = (isComplete) =>
    isComplete ? s.userPayoutReady : s.userPayoutPending;

  const getWithdrawalStatusClass = (status) =>
    s.withdrawalStatusColors[status] || s.withdrawalStatusDefault;

  const statCards = [
    {
      label: "Total Users",
      value: summary.users || 0,
      icon: Users,
      bg: s.statBg1,
      c: s.statColor1,
    },
    {
      label: "Paid Bookings",
      value: summary.paidBookings || 0,
      icon: CheckCircle,
      bg: s.statBg2,
      c: s.statColor2,
    },
    {
      label: "Gross Revenue",
      value: formatMoney(summary.grossRevenue),
      icon: TrendingUp,
      bg: s.statBg3,
      c: s.statColor3,
    },
    {
      label: "Platform Fees",
      value: formatMoney(summary.platformFees),
      icon: IndianRupee,
      bg: s.statBg4,
      c: s.statColor4,
    },
    {
      label: "Provider Payouts",
      value: formatMoney(summary.providerPayouts),
      icon: Wallet,
      bg: s.statBg5,
      c: s.statColor5,
    },
    {
      label: "Withdrawal Hold",
      value: formatMoney(summary.withdrawalHolds),
      icon: Landmark,
      bg: s.statBg6,
      c: s.statColor6,
    },
  ];

  return (
    <div className={s.pageContainer}>
      {/* header */}
      <header className={s.header}>
        <div className={s.headerInner}>
          <div className={s.logoRow}>
            <img src={logo} className={s.logoImg} alt="logo" />
          </div>
          <div>
            <Link to="/admin/dashboard" className={s.logoText}>
              BookMe <span className={s.logoAccent}>Admin</span>
            </Link>
          </div>
          <div className={s.headerActions}>
            <Link to="/" className={s.clientAppLink}>
              Client App
            </Link>

            <button type="button" onClick={logout} className={s.logoutButton}>
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* main */}
      <main className={s.main}>
        <section className={s.heroSection}>
          <div>
            <h1 className={s.heroTitle}>
              Platform <span className={s.heroTitleAccent}>Overview</span>
            </h1>
            <p className={s.heroSubtitle}>
              Users, booking, revenue and active withdrawals
            </p>
          </div>
          {message && <div className={s.messageBanner}>{message}</div>}
        </section>

        {/* cards */}
        <section className={s.statsGrid}>
          {statCards.map((stat, i) => {
            const Icon = stat.icon;

            return (
              <div key={i} className={s.statCard}>
                <div className={`${s.statIconContainer} ${stat.bg} ${stat.c}`}>
                  <Icon className={s.statIcon} />
                </div>
                <div>
                  <p className={s.statLabel}>{stat.label}</p>
                  <h2 className={s.statValue}>{stat.value}</h2>
                </div>
              </div>
            );
          })}
        </section>

        {/* table card */}
        <section className={s.tablesGrid}>
          <div className={s.tableCard}>
            <div className={s.tableHeader}>
              <h2 className={s.tableTitle}>
                <UserCheck className={s.tableTitleIcon} />
                Registered Users
              </h2>
            </div>

            <div className={s.tableScrollContainer}>
              <table className={s.table}>
                <thead>
                  <tr className={s.tableHeadRow}>
                    <th className={s.th}>Business</th>
                    <th className={s.th}>Email</th>
                    <th className={s.th}>Slug</th>
                    <th className={s.th}>Status</th>
                  </tr>
                </thead>

                <tbody className={s.tbody}>
                  {(dashboard?.users || []).map((user) => (
                    <tr key={user._id} className={s.tr}>
                      <td className={s.td}>
                        <div className={s.userBusinessName}>
                          {user.businessName || user.name}
                        </div>
                      </td>

                      <td className={s.tdMuted}>{user.email || "—"}</td>

                      <td className={s.tdMuted}>/book/{user.slug || "—"}</td>

                      <td className={s.td}>
                        <span
                          className={`${s.payoutStatusBadge} ${getPayoutStatusClass(
                            user.payoutDetails?.isComplete,
                          )}`}
                        >
                          {user.payoutDetails?.isComplete
                            ? "Ready"
                            : "Pending Details"}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {dashboard && dashboard.users?.length === 0 && (
                    <tr>
                      <td colSpan={4} className={s.emptyTableCell}>
                        No users found!!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* withdrawal card */}
          <div className={s.withdrawalCard}>
            <h2 className={`${s.tableTitle} ${s.sectionTitleSpacing}`}>
              <Clock className={s.tableTitleIcon} />
              Withdrawal Requests
            </h2>
            <div className={s.withdrawalList}>
              {(dashboard?.withdrawals || []).map((withdrawal) => {
                const iswithdrawallocked = isTerminalStatus(withdrawal.status);
                return (
                  <div key={withdrawal._id} className={s.withdrawalItem}>
                    <div className={s.withdrawalItemHeader}>
                      <div>
                        <p className={s.withdrawalProviderName}>
                          {withdrawal.userId?.businessName ||
                            withdrawal.userId?.name ||
                            "Provider"}
                        </p>
                      </div>
                      <p className={s.withdrawalProviderEmail}>
                        {withdrawal.userId?.email}
                      </p>
                    </div>

                    <div className={s.withdrawalAmountCol}>
                      <span className={s.withdrawalAmount}>
                        {formatMoney(withdrawal.amount)}
                      </span>
                      <div className={s.withdrawalStatusWrap}>
                        <span
                          className={`${s.withdrawalStatusBadge} ${getWithdrawalStatusClass(
                            withdrawal.status,
                          )}`}
                        >
                          {withdrawal.status}
                        </span>
                      </div>
                    </div>

                    <div className={s.withdrawalAccountInfo}>
                      <Landmark className={s.withdrawalAccountIcon} />
                      {withdrawal.payoutSnapshot?.bankName || withdrawal.payoutSnapshot?.bankname ||
                        "UPI Connection"}{" "}
                      .{" "}
                      {withdrawal.payoutSnapshot?.accountLast4
                        ? `****${withdrawal.payoutSnapshot.accountLast4}`
                        : withdrawal.payoutSnapshot?.upiId}
                    </div>

                    <div className={s.withdrawalActions}>
                      {withdrawalStatus.map((status) => {
                        const iscurrentStatus = withdrawal.status === status;
                        const isupdatingwithdrawal =
                          updatepayout === withdrawal._id;

                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() => {
                              requestwithdrawalStatusChange(withdrawal, status);
                            }}
                            disabled={
                              iscurrentStatus ||
                              iswithdrawallocked ||
                              isupdatingwithdrawal ||
                              (status === "paid" && withdrawal.status !== "processing")
                            }
                            className={`${s.withdrawalActionBtn} ${
                              iscurrentStatus
                                ? s.withdrawalActionBtnActive
                                : s.withdrawalActionBtnInactive
                            }`}
                          >
                            {isupdatingwithdrawal && !iscurrentStatus
                              ? "..."
                              : status === "processing" ? "Accept" : formatStatusLabel(status)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {dashboard && dashboard.withdrawals?.length === 0 && (
                <div className={s.emptyWithdrawals}>
                  <div className={s.emptyWithdrawalsIconCircle}>
                    <CheckCircle className={s.emptyWithdrawalsIcon} />
                  </div>
                  <p className={s.emptyWithdrawalsText}>
                    No pending withdrawal requests!!!
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className={s.recentBookingsCard}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className={s.tableTitle}>
              <CalendarDays className={s.tableTitleIcon} /> Manage All Bookings
            </h2>
            <select
              value={bookingStatusFilter}
              onChange={(event) => { setBookingStatusFilter(event.target.value); setBookingPage(1); }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              aria-label="Filter bookings by status"
            >
              {["all", "pending", "pending_payment", "confirmed", "cancelled", "payment_failed"].map((status) => (
                <option key={status} value={status}>{status === "all" ? "All statuses" : status.replaceAll("_", " ")}</option>
              ))}
            </select>
          </div>
          <div className={s.tableScrollContainer}>
            <table className={s.table}>
              <thead><tr className={s.tableHeadRow}>
                <th className={s.th}>Customer</th><th className={s.th}>Provider</th><th className={s.th}>Service</th>
                <th className={s.th}>Date and time</th><th className={s.th}>Status</th><th className={s.th}>Manage</th>
              </tr></thead>
              <tbody className={s.tbody}>
                {adminBookings.map((booking) => (
                  <tr key={booking._id} className={s.tr}>
                    <td className={s.td}><div className={s.userBusinessName}>{booking.customerName}</div><div className={s.tdMuted}>{booking.customerEmail}</div></td>
                    <td className={s.tdMuted}>{booking.userId?.businessName || booking.userId?.name || "Provider"}</td>
                    <td className={s.tdMuted}>{booking.serviceId?.name || "Service"}</td>
                    <td className={s.tdMuted}>{booking.date}<br />{booking.startTime}–{booking.endTime}</td>
                    <td className={s.td}><span className={s.bookingPayoutBadge}>{booking.status?.replaceAll("_", " ")}</span></td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        {booking.status !== "confirmed" && ["paid", "not_required"].includes(booking.paymentStatus) && (
                          <button type="button" onClick={() => changeAdminBookingStatus(booking, "confirmed")} className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700">Confirm</button>
                        )}
                        {!['cancelled', 'payment_failed'].includes(booking.status) && (
                          <button type="button" onClick={() => changeAdminBookingStatus(booking, "cancelled")} className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700">Cancel</button>
                        )}
                        {booking.status === "confirmed" && (
                          <button type="button" onClick={() => setRescheduleDraft({ id: booking._id, date: booking.date, startTime: booking.startTime, endTime: booking.endTime })} className="rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-700">Reschedule</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {adminBookings.length === 0 && <tr><td colSpan={6} className={s.emptyTableCell}>No bookings match this filter.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>{bookingPagination.total} bookings · Page {bookingPagination.page} of {bookingPagination.pages || 1}</span>
            <div className="flex gap-2">
              <button type="button" disabled={bookingPage <= 1} onClick={() => setBookingPage((page) => Math.max(1, page - 1))} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40">Previous</button>
              <button type="button" disabled={bookingPage >= bookingPagination.pages} onClick={() => setBookingPage((page) => page + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40">Next</button>
            </div>
          </div>
        </section>

        {/* Recent bookings table */}
        <section className={s.recentBookingsCard}>
          <h2 className={`${s.tableTitle} ${s.sectionTitleSpacing}`}>
            <CheckCircle className={s.tableTitleIcon} /> Recent Paid Bookings
          </h2>
          <div className={s.tableScrollContainer}>
            <table className={s.table}>
              <thead>
                <tr className={s.tableHeadRow}>
                  <th className={s.th}>Provider</th>
                  <th className={s.th}>Service</th>
                  <th className={s.th}>Gross</th>
                  <th className={s.th}>Fees</th>
                  <th className={s.th}>Provider Share</th>
                  <th className={s.th}>Status</th>
                </tr>
              </thead>
              <tbody className={s.tbody}>
                {(dashboard?.recentBookings || []).map((booking) => (
                  <tr key={booking._id} className={s.tr}>
                    <td className={s.tdBold}>
                      {booking.userId?.businessName || booking.userId?.name}
                    </td>
                    <td className={s.tdMuted}>
                      {booking.serviceId?.name || "Service"}
                    </td>
                    <td className={s.tdBold}>{formatMoney(booking.amount)}</td>
                    <td className={s.tdFees}>
                      {formatMoney(booking.platformFeeAmount)}
                    </td>
                    <td className={s.tdEarnings}>
                      {formatMoney(booking.providerPayoutAmount)}
                    </td>
                    <td className={s.td}>
                      <span className={s.bookingPayoutBadge}>
                        {booking.payoutStatus}
                      </span>
                    </td>
                  </tr>
                ))}

                {dashboard && dashboard.recentBookings?.length === 0 && (
                  <tr>
                    <td colSpan={6} className={s.emptyTableCell}>
                      No recent transactions.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {rescheduleDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form onSubmit={saveAdminReschedule} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900">Reschedule booking</h2>
            <p className="mt-1 text-sm text-slate-500">The new time must fit the provider’s availability and service duration.</p>
            <label className="mt-4 block text-sm font-medium text-slate-700">Date
              <input type="date" required value={rescheduleDraft.date} onChange={(event) => setRescheduleDraft((prev) => ({ ...prev, date: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
            </label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="text-sm font-medium text-slate-700">Start
                <input type="time" required value={rescheduleDraft.startTime} onChange={(event) => setRescheduleDraft((prev) => ({ ...prev, startTime: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
              </label>
              <label className="text-sm font-medium text-slate-700">End
                <input type="time" required value={rescheduleDraft.endTime} onChange={(event) => setRescheduleDraft((prev) => ({ ...prev, endTime: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setRescheduleDraft(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Close</button>
              <button type="submit" className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white">Save reschedule</button>
            </div>
          </form>
        </div>
      )}

      {/* confirmation modal – outside <main>, inside page container */}
      {pendingpayout && pendingWithdrawal && (
        <div className={s.confirmModalOverlay}>
          <div
            className={s.confirmModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="withdrawal-confirm-title"
          >
            <div className={s.confirmModalIconRow}>
              <span className={s.confirmModalIconWrap}>
                <WithdrawalConfirmIcon className={s.confirmModalIcon} />
              </span>
              <span
                className={`${s.withdrawalStatusBadge} ${getWithdrawalStatusClass(
                  pendingpayout.status,
                )}`}
              >
                {pendingpayout.status}
              </span>
            </div>

            <h3 id="withdrawal-confirm-title" className={s.confirmModalTitle}>
              Confirm withdrawal status
            </h3>
            <p className={s.confirmModalText}>
              Are you sure you want to mark this withdrawal as{" "}
              {formatStatusLabel(pendingpayout.status)}?
            </p>

            <div className={s.confirmModalMeta}>
              <span>
                {pendingWithdrawal.userId?.businessName ||
                  pendingWithdrawal.userId?.name ||
                  "Provider"}
              </span>
              <strong>{formatMoney(pendingWithdrawal.amount)}</strong>
            </div>

            <div className={s.confirmModalActions}>
              <button
                type="button"
                onClick={closewithdrawalConfirm}
                disabled={isConfirmingWithdrawal}
                className={s.confirmModalCancelBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={changeWithdrawalStatus}
                disabled={isConfirmingWithdrawal}
                className={s.confirmModalConfirmBtn}
              >
                {isConfirmingWithdrawal
                  ? "Confirming..."
                  : `Confirm ${formatStatusLabel(pendingpayout.status)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
