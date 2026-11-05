import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Cookies from "js-cookie";

import AdminDashboardPage from "./admin/AdminDashboardPage";
import AdminLoginPage from "./admin/AdminLoginPage";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";
import BookingSuccessPage from "./pages/BookingSuccessPage";
import BookingCancelledPage from "./pages/BookingCancelledPage";
import Booking from "./pages/Booking";
import AvailabilityPage from "./pages/AvailabilityPage";
import ServicesPage from "./pages/ServicesPage";
import PaymentPage from "./pages/paymentPage";
import PublicBookingPage from "./pages/PublicBookingPage";
import PublicProfilePage from "./pages/PublicProfilePage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicesPage";

// Protected (user) route
const ProcectedRoute = ({ children }) => {
  const location = useLocation();
  const hasToken = Boolean(Cookies.get("token"));

  if (!hasToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
};

//  Protected (admin) route
const AdminProcetedRoute = ({ children }) => {
  const hasAdminToken = Boolean(localStorage.getItem("adminToken"));

  if (!hasAdminToken) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

// -Public-only route (login when already authed)
const PublicOnlyRoute = ({ children }) => {
  const hasToken = Boolean(Cookies.get("token"));

  if (hasToken) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const App = () => {
  return (
    <Routes>
      {/* User */}
      <Route
        path="/"
        element={
          <ProcectedRoute>
            <DashboardPage />
          </ProcectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProcectedRoute>
            <ProfilePage />
          </ProcectedRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <AuthPage />
          </PublicOnlyRoute>
        }
      />
      <Route path="/payments" element={<ProcectedRoute><PaymentPage /></ProcectedRoute>}/>
      <Route path="/book/:slug" element={<PublicBookingPage />}/>
      <Route path="/public/:slug" element={<PublicBookingPage />}/>
      <Route path="/p/:slug" element={<PublicProfilePage />} />
      <Route
        path="/booking"
        element={
          <ProcectedRoute>
            <Booking />
          </ProcectedRoute>
        }
      />
      <Route  path="/availability" element={<ProcectedRoute><AvailabilityPage /></ProcectedRoute>}/>
      <Route path="/services" element={<ProcectedRoute><ServicesPage /></ProcectedRoute>}/>
      <Route path="/booking/success" element={<BookingSuccessPage />} />
      <Route path="/booking/cancelled" element={<BookingCancelledPage />} />
      <Route path="privacy" element={<PrivacyPolicyPage />}/>
      <Route path="terms" element={<TermsOfServicePage />}/>

      {/* Admin */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin/dashboard"
        element={
          <AdminProcetedRoute>
            <AdminDashboardPage />
          </AdminProcetedRoute>
        }
      />

      {/* Catch-all */}
      {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
    </Routes>
  );
};

export default App;
