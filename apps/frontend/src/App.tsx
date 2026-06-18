import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/shared/Layout";
import { HomePage } from "./pages/HomePage";
import { SearchPage } from "./pages/SearchPage";
import { DoctorProfilePage } from "./pages/DoctorProfilePage";
import { BookingPage } from "./pages/BookingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterDoctorPage } from "./pages/RegisterDoctorPage";
import { RegisterPatientPage } from "./pages/RegisterPatientPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { PatientDashboard } from "./pages/patient/PatientDashboard";
import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import { EnhancedDashboardOverview } from "./pages/dashboard/EnhancedDashboardOverview";
import { ScheduleManager } from "./pages/dashboard/ScheduleManager";
import { AppointmentsList } from "./pages/dashboard/AppointmentsList";
import { DoctorSettingsPage } from "./pages/dashboard/DoctorSettingsPage";
import { AssistantsManager } from "./pages/dashboard/AssistantsManager";
import { NotificationsPage } from "./pages/dashboard/NotificationsPage";
import { StatsPage } from "./pages/dashboard/StatsPage";
import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminLoginPage } from "./pages/admin/AdminLoginPage";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminDoctors } from "./pages/admin/AdminDoctors";
import { OnboardingBookingMode } from "./pages/OnboardingBookingMode";
import { CancelAppointmentPage } from "./pages/CancelAppointmentPage";
import { BillingPage } from "./pages/dashboard/BillingPage";

import { useEffect } from "react";
import { useAuthStore } from "./lib/authStore";

function App() {
  const checkAuth = useAuthStore(state => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/cancel-appointment/:token" element={<CancelAppointmentPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register/doctor" element={<RegisterDoctorPage />} />
          <Route path="/register/patient" element={<RegisterPatientPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/onboarding/booking-mode" element={<OnboardingBookingMode />} />
          {/* Legacy routes for backwards compatibility */}
          <Route path="/doctor/:identifier" element={<DoctorProfilePage />} />
          <Route path="/doctor/:identifier/book" element={<BookingPage />} />
          
          {/* Catch-all routes for Doctor Public Profile and Booking */}
          <Route path="/:identifier" element={<DoctorProfilePage />} />
          <Route path="/:identifier/book" element={<BookingPage />} />
        </Route>

        {/* Dashboard Routes for Doctors */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<EnhancedDashboardOverview />} />
          <Route path="agenda" element={<div className="p-8"><h1 className="text-2xl font-bold">Agenda</h1><p>Vue détaillée à venir...</p></div>} />
          <Route path="schedule" element={<ScheduleManager />} />
          <Route path="appointments" element={<AppointmentsList />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="settings" element={<DoctorSettingsPage />} />
          <Route path="assistants" element={<AssistantsManager />} />
          <Route path="billing" element={<BillingPage />} />
        </Route>

        {/* Admin Panel Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="doctors" element={<AdminDoctors />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
