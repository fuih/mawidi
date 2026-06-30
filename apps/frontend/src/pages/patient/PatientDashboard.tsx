import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Calendar, Clock, XCircle, Users, CheckCircle2,
  AlertCircle, Ban, History, Stethoscope, MapPin, ArrowRight,
} from "lucide-react";
import api from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";
import { Skeleton } from "../../components/ui/Skeleton";

interface Appointment {
  id: string;
  doctor_first_name: string;
  doctor_last_name: string;
  doctor_specialty: string;
  doctor_city: string;
  appointment_date: string;
  appointment_time: string | null;
  queue_number: number | null;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  reason: string | null;
}

const STATUS_CONFIG = {
  pending:   { labelKey: "patientDashboard.pending",    cls: "bg-amber-50 text-amber-700 border-amber-200",   icon: Clock },
  confirmed: { labelKey: "patientDashboard.confirmed",      cls: "bg-green-50 text-green-700 border-green-200",   icon: CheckCircle2 },
  completed: { labelKey: "patientDashboard.completed",       cls: "bg-blue-50 text-blue-700 border-blue-200",      icon: CheckCircle2 },
  cancelled: { labelKey: "patientDashboard.cancelled",        cls: "bg-red-50 text-red-700 border-red-200",         icon: Ban },
  no_show:   { labelKey: "patientDashboard.noShow",  cls: "bg-gray-100 text-gray-500 border-gray-200",    icon: AlertCircle },
};

/** Parse "YYYY-MM-DD" in local timezone to avoid UTC rollback */
const parseLocalDate = (s: string) => new Date(`${s}T00:00`);

const formatDate = (s: string, lang: string) =>
  parseLocalDate(s).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : lang === 'en' ? 'en-US' : 'fr-FR', {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

export function PatientDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, userType, isInitializing } = useAuthStore();
  const { t, i18n } = useTranslation();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState("");
  const [filter, setFilter] = useState<"upcoming" | "past" | "all">("upcoming");

  useEffect(() => {
    if (isInitializing) return;
    
    if (!isAuthenticated || userType !== "patient") {
      navigate("/login");
      return;
    }
    
    api.get("/appointments/patient/me")
      .then((r) => setAppointments(r.data))
      .catch((err) => {
        const detail = err.response?.data?.detail || err.message || t('patientDashboard.unknownError');
        setFetchError(t('patientDashboard.errorWithStatus', { status: err.response?.status ?? "?", detail }));
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, userType, navigate, isInitializing]);

  const handleCancel = async (id: string) => {
    if (!confirm(t('patientDashboard.confirmCancel'))) return;
    setCancellingId(id);
    setCancelError("");
    try {
      await api.patch(`/appointments/patient/${id}/cancel`);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a))
      );
    } catch (err: any) {
      setCancelError(err.response?.data?.detail || t('patientDashboard.cancelError'));
    } finally {
      setCancellingId(null);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = appointments.filter((a) => {
    const d = parseLocalDate(a.appointment_date);
    const isUpcoming = d >= today && !["cancelled", "completed", "no_show"].includes(a.status);
    if (filter === "upcoming") return isUpcoming;
    if (filter === "past") return !isUpcoming;
    return true;
  });

  const upcomingCount = appointments.filter((a) => {
    const d = parseLocalDate(a.appointment_date);
    return d >= today && !["cancelled", "completed", "no_show"].includes(a.status);
  }).length;

  if (loading || isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center gap-4">
              <Skeleton className="w-14 h-14 rounded-2xl" />
              <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <div className="flex gap-2 bg-white border rounded-xl p-1 w-fit">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border p-5 flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex gap-4 items-start flex-1">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="w-full">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-64 mb-3" />
                    <div className="flex gap-3">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Skeleton className="h-8 w-24 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
              <History className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('patientDashboard.myPatientSpace')}</h1>
              <p className="text-gray-500 text-sm mt-0.5 text-start">
                {upcomingCount > 0
                  ? t('patientDashboard.upcomingAppointmentsCount', { count: upcomingCount })
                  : t('patientDashboard.noUpcomingAppointments')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {fetchError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl flex gap-3 items-start text-start">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">{t('patientDashboard.loadError')}</p>
              <p>{fetchError}</p>
            </div>
          </div>
        )}

        {cancelError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl flex gap-3 items-start">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            {cancelError}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 bg-white border rounded-xl p-1 w-fit">
          {(["upcoming", "past", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {f === "upcoming" && t('patientDashboard.upcoming')}
              {f === "past" && t('patientDashboard.past')}
              {f === "all" && t('patientDashboard.all')}
            </button>
          ))}
        </div>

        {/* Appointments list */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border p-16 text-center">
            <Calendar className="h-14 w-14 mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">{t('patientDashboard.noAppointmentsFound')}</p>
            <button
              onClick={() => navigate("/search")}
              className="mt-6 flex items-center gap-2 mx-auto bg-primary text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              {t('patientDashboard.findDoctor')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((appt) => {
              const cfg = STATUS_CONFIG[appt.status];
              const StatusIcon = cfg.icon;
              const isActive = ["pending", "confirmed"].includes(appt.status);
              const isFuture = parseLocalDate(appt.appointment_date) >= today;

              return (
                <div
                  key={appt.id}
                  className={`bg-white rounded-2xl border transition-all ${
                    isActive ? "shadow-sm hover:shadow-md" : "opacity-80"
                  }`}
                >
                  <div className="p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    {/* Left: Doctor info + date */}
                    <div className="flex gap-4 items-start flex-1 min-w-0">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isActive ? "bg-primary/10" : "bg-gray-100"}`}>
                        <Stethoscope className={`h-6 w-6 ${isActive ? "text-primary" : "text-gray-400"}`} />
                      </div>

                      <div className="min-w-0 text-start">
                        <h3 className="font-bold text-gray-900">
                          {t('patientDashboard.dr')}{appt.doctor_first_name} {appt.doctor_last_name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                          {appt.doctor_specialty && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Stethoscope className="h-3 w-3" />
                              {appt.doctor_specialty}
                            </span>
                          )}
                          {appt.doctor_city && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {appt.doctor_city}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                          <span className="text-sm text-gray-700 flex items-center gap-1.5 capitalize">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {formatDate(appt.appointment_date, i18n.language)}
                          </span>
                          {appt.appointment_time ? (
                            <span className="text-sm text-gray-700 flex items-center gap-1.5">
                              <Clock className="h-4 w-4 text-gray-400" />
                              {appt.appointment_time.slice(0, 5)}
                            </span>
                          ) : appt.queue_number != null ? (
                            <span className="text-sm flex items-center gap-1.5">
                              <Users className="h-4 w-4 text-orange-400" />
                              <span className="font-semibold text-orange-600">
                                {t('patientDashboard.queueNumber', { number: appt.queue_number })}
                              </span>
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500 flex items-center gap-1.5">
                              <Users className="h-4 w-4 text-gray-400" />
                              {t('patientDashboard.queue')}
                            </span>
                          )}
                        </div>

                        {appt.reason && (
                          <p className="mt-1 text-xs text-gray-400 truncate max-w-xs">
                            {t('patientDashboard.reason', { reason: appt.reason })}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Status badge + cancel */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${cfg.cls}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {t(cfg.labelKey)}
                      </span>

                      {isActive && isFuture && (
                        <button
                          onClick={() => handleCancel(appt.id)}
                          disabled={cancellingId === appt.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-red-600 hover:bg-red-50 border border-red-200 transition-colors disabled:opacity-50"
                        >
                          {cancellingId === appt.id ? (
                            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          {t('patientDashboard.cancel')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA to book more */}
        {filtered.length > 0 && (
          <div className="text-center pt-4">
            <button
              onClick={() => navigate("/search")}
              className="inline-flex items-center gap-2 text-primary font-medium text-sm hover:underline"
            >
              {t('patientDashboard.bookNewAppointment')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
