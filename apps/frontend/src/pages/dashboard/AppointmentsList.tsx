import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CalendarDays,
  Phone,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Search,
  RefreshCw,
  UserPlus
} from "lucide-react";
import api from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";
import { ManualBookingModal } from "../../components/dashboard/ManualBookingModal";
import { RescheduleModal } from "../../components/dashboard/RescheduleModal";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string | null;
  queue_number: number | null;
  patient_name: string;
  patient_phone: string;
  reason: string | null;
  status: string;
  is_new_patient: boolean;
}

const STATUS_CONFIG: Record<string, { labelKey: string; color: string; icon: React.ReactNode }> = {
  pending: { labelKey: "dashboardOverview.statusPending", color: "bg-yellow-50 text-yellow-800 border-yellow-200", icon: <Clock className="h-3.5 w-3.5" /> },
  confirmed: { labelKey: "dashboardOverview.statusConfirmed", color: "bg-blue-50 text-blue-800 border-blue-200", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  completed: { labelKey: "dashboardOverview.statusCompleted", color: "bg-green-50 text-green-800 border-green-200", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  cancelled: { labelKey: "dashboardOverview.statusCancelled", color: "bg-red-50 text-red-700 border-red-200", icon: <XCircle className="h-3.5 w-3.5" /> },
  no_show: { labelKey: "dashboardOverview.statusNoShow", color: "bg-gray-100 text-gray-600 border-gray-200", icon: <AlertCircle className="h-3.5 w-3.5" /> },
};

export function AppointmentsList() {
  const navigate = useNavigate();
  const { isAuthenticated, userType } = useAuthStore();
  const { t, i18n } = useTranslation();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [autoConfirm, setAutoConfirm] = useState(false);
  const [togglingAutoConfirm, setTogglingAutoConfirm] = useState(false);
  const [isManualBookOpen, setIsManualBookOpen] = useState(false);
  const [rescheduleData, setRescheduleData] = useState<{id: string, name: string} | null>(null);

  const fetchAll = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const params = filterDate ? { start_date: filterDate, end_date: filterDate } : {};
      const [apptRes, profileRes] = await Promise.all([
        api.get("/dashboard/appointments", { params }),
        api.get("/dashboard/profile"),
      ]);
      setAppointments(apptRes.data);
      setAutoConfirm(profileRes.data.auto_confirm_appointments ?? false);
    } catch (err: any) {
      if (err.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate, filterDate]);

  useEffect(() => {
    if (!isAuthenticated || !["doctor", "assistant"].includes(userType as string)) {
      navigate("/login");
      return;
    }
    fetchAll(true);
  }, [isAuthenticated, userType, fetchAll, filterDate]);

  const updateStatus = async (id: string, newStatus: string, reason?: string) => {
    setActionLoading(id + newStatus);
    try {
      await api.patch(`/dashboard/appointments/${id}/status`, {
        status: newStatus,
        cancellation_reason: reason || null,
      });
      await fetchAll(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || t('appointmentsList.error'));
    } finally {
      setActionLoading(null);
    }
  };

  const toggleAutoConfirm = async () => {
    setTogglingAutoConfirm(true);
    try {
      await api.patch("/dashboard/settings/auto-confirm", { auto_confirm: !autoConfirm });
      setAutoConfirm(!autoConfirm);
    } catch {
      alert(t('appointmentsList.errorUpdatingSetting'));
    } finally {
      setTogglingAutoConfirm(false);
    }
  };

  const filtered = appointments.filter((a) => {
    const matchesStatus = filterStatus === "all" || a.status === filterStatus;
    const matchesSearch = !search || a.patient_name.toLowerCase().includes(search.toLowerCase()) || a.patient_phone.includes(search);
    return matchesStatus && matchesSearch;
  });

  const StatusBadge = ({ status }: { status: string }) => {
    const cfg = STATUS_CONFIG[status];
    if (!cfg) return null;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
        {cfg.icon} {t(cfg.labelKey)}
      </span>
    );
  };

  const ActionButtons = ({ apt }: { apt: Appointment }) => {
    const isLoading = (s: string) => actionLoading === apt.id + s;
    const btn = (label: string, onClick: () => void, style: string, disabled = false) => (
      <button
        onClick={onClick}
        disabled={disabled || !!actionLoading}
        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${style}`}
      >
        {disabled ? <RefreshCw className="h-3 w-3 animate-spin inline" /> : label}
      </button>
    );

    switch (apt.status) {
      case "pending":
        return (
          <div className="flex items-center gap-2 flex-wrap">
            {btn(t('dashboardOverview.reschedule'), () => setRescheduleData({id: apt.id, name: apt.patient_name}), "border-indigo-200 text-indigo-600 hover:bg-indigo-50")}
            {btn(t('appointmentsList.confirm'), () => updateStatus(apt.id, "confirmed"), "bg-blue-600 text-white border-blue-600 hover:bg-blue-700", isLoading("confirmed"))}
            {btn(t('dashboardOverview.cancel'), () => updateStatus(apt.id, "cancelled", t('appointmentsList.cancelledByDoctor')), "border-red-200 text-red-600 hover:bg-red-50", isLoading("cancelled"))}
          </div>
        );
      case "confirmed": {
        const todayDateStr = new Date().toISOString().split("T")[0];
        const canMarkAbsent = apt.appointment_date <= todayDateStr;
        return (
          <div className="flex items-center gap-2 flex-wrap">
            {btn(t('dashboardOverview.reschedule'), () => setRescheduleData({id: apt.id, name: apt.patient_name}), "border-indigo-200 text-indigo-600 hover:bg-indigo-50")}
            {btn(t('dashboardOverview.done'), () => updateStatus(apt.id, "completed"), "bg-green-600 text-white border-green-600 hover:bg-green-700", isLoading("completed"))}
            {canMarkAbsent && btn(t('appointmentsList.markNoShow'), () => updateStatus(apt.id, "no_show"), "border-gray-300 text-gray-600 hover:bg-gray-50", isLoading("no_show"))}
            {btn(t('dashboardOverview.cancel'), () => updateStatus(apt.id, "cancelled", t('appointmentsList.cancelledByDoctor')), "border-red-200 text-red-600 hover:bg-red-50", isLoading("cancelled"))}
          </div>
        );
      }
      case "cancelled":
        return (
          <div className="flex items-center gap-2">
            {btn(t('dashboardOverview.reschedule'), () => setRescheduleData({id: apt.id, name: apt.patient_name}), "border-indigo-200 text-indigo-600 hover:bg-indigo-50")}
            {btn(t('appointmentsList.restore'), () => updateStatus(apt.id, "pending"), "border-yellow-300 text-yellow-700 hover:bg-yellow-50", isLoading("pending"))}
          </div>
        );
      case "no_show":
        return (
          <div className="flex items-center gap-2">
            {btn(t('dashboardOverview.reschedule'), () => setRescheduleData({id: apt.id, name: apt.patient_name}), "border-indigo-200 text-indigo-600 hover:bg-indigo-50")}
            {btn(t('appointmentsList.restore'), () => updateStatus(apt.id, "confirmed"), "border-blue-300 text-blue-700 hover:bg-blue-50", isLoading("confirmed"))}
          </div>
        );
      case "completed":
        return (
          <div className="flex items-center gap-2">
            {btn(t('dashboardOverview.reschedule'), () => setRescheduleData({id: apt.id, name: apt.patient_name}), "border-indigo-200 text-indigo-600 hover:bg-indigo-50")}
          </div>
        );
      default:
        return <span className="text-xs text-gray-400">—</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p>{t('appointmentsList.loadingAppointments')}</p>
        </div>
      </div>
    );
  }

  const counts: Record<string, number> = { all: appointments.length };
  appointments.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1; });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="text-start">
            <h1 className="text-2xl font-bold text-gray-900">{t('appointmentsList.appointmentsTitle')}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{t('appointmentsList.totalAppointments', { count: appointments.length })}</p>
          </div>
          <button 
            onClick={() => setIsManualBookOpen(true)}
            className="hidden sm:flex text-sm font-medium text-white bg-primary px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            {t('dashboardOverview.new')}
          </button>
        </div>

        {/* Auto-Confirm Toggle */}
        <div
          onClick={toggleAutoConfirm}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all select-none ${autoConfirm
            ? "border-green-400 bg-green-50"
            : "border-gray-200 bg-white hover:border-gray-300"
            }`}
        >
          <div className="flex-1 text-start">
            <p className={`text-sm font-bold ${autoConfirm ? "text-green-800" : "text-gray-700"}`}>
              {t('appointmentsList.autoConfirm')}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {autoConfirm ? t('appointmentsList.autoConfirmDescOn') : t('appointmentsList.autoConfirmDescOff')}
            </p>
          </div>
          {togglingAutoConfirm
            ? <RefreshCw className="h-6 w-6 text-gray-400 animate-spin" />
            : autoConfirm
              ? <ToggleRight className="h-8 w-8 text-green-600" />
              : <ToggleLeft className="h-8 w-8 text-gray-400" />
          }
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* Search & Date Filter */}
          <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-3">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('appointmentsList.searchPatient')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full ltr:pl-9 rtl:pr-9 ltr:pr-4 rtl:pl-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-gray-600 cursor-pointer"
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate("")}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                  title={t('appointmentsList.clearDate')}
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { key: "all", label: t('appointmentsList.filterAll') },
              { key: "pending", label: t('appointmentsList.filterPending') },
              { key: "confirmed", label: t('appointmentsList.filterConfirmed') },
              { key: "completed", label: t('appointmentsList.filterCompleted') },
              { key: "cancelled", label: t('appointmentsList.filterCancelled') },
              { key: "no_show", label: t('appointmentsList.filterNoShow') },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filterStatus === key
                  ? "bg-primary text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
              >
                {label} {counts[key] !== undefined && <span className="ml-1 opacity-75">({counts[key] || 0})</span>}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-500 flex flex-col items-center gap-3">
            <CalendarDays className="h-12 w-12 text-gray-300" />
            <p className="text-lg font-medium">{t('appointmentsList.noAppointmentsFound')}</p>
            <p className="text-sm">{t('appointmentsList.tryChangingFilters')}</p>
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((apt) => (
              <div key={apt.id} className={`p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors hover:bg-gray-50/80 ${apt.status === "cancelled" ? "opacity-60" : ""}`}>

                {/* Patient Info */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* Date/Time Column */}
                  <div className="shrink-0 w-20 text-center bg-gray-50 rounded-xl p-2.5 border">
                    <p className="text-xs font-medium text-gray-500 uppercase">
                      {new Date(apt.appointment_date).toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : i18n.language === 'en' ? 'en-US' : 'fr-FR', { month: 'short' })}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 leading-none my-1">
                      {new Date(apt.appointment_date).getDate()}
                    </p>
                    <p className="text-xs font-semibold text-primary">
                      {apt.appointment_time ? apt.appointment_time.substring(0, 5) : apt.queue_number != null ? `#${apt.queue_number}` : "—"}
                    </p>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-base font-bold text-gray-900">{apt.patient_name}</h3>
                      {apt.is_new_patient && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 uppercase tracking-wider">
                          <UserPlus className="h-3 w-3" /> {t('dashboardOverview.newPatient')}
                        </span>
                      )}
                      <StatusBadge status={apt.status} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        {apt.patient_phone}
                      </span>
                      {apt.reason && (
                        <span className="truncate max-w-xs bg-gray-100 rounded px-2 py-0.5 text-xs text-gray-600">
                          {apt.reason}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="shrink-0">
                  <ActionButtons apt={apt} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ManualBookingModal 
        isOpen={isManualBookOpen} 
        onClose={() => setIsManualBookOpen(false)} 
        onSuccess={() => fetchAll(true)} 
        initialDate={filterDate ? new Date(filterDate) : new Date()} 
      />

      {rescheduleData && (
        <RescheduleModal
          isOpen={!!rescheduleData}
          onClose={() => setRescheduleData(null)}
          appointmentId={rescheduleData.id}
          patientName={rescheduleData.name}
          onSuccess={() => fetchAll(false)}
        />
      )}
    </div>
  );
}
