import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";
import { AgendaWidget } from "../../components/dashboard/widgets/AgendaWidget";
import { ManualBookingModal } from "../../components/dashboard/ManualBookingModal";
import { RescheduleModal } from "../../components/dashboard/RescheduleModal";
import { Skeleton } from "../../components/ui/Skeleton";

interface Stats {
  total: number;
  today: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  no_show: number;
  fill_rate?: number;
  no_show_rate?: number;
}

interface Appointment {
  id: string;
  patient_name: string;
  patient_phone: string;
  appointment_time: string;
  reason: string | null;
  status: string;
  is_new_patient: boolean;
  queue_number?: number;
}

export function EnhancedDashboardOverview() {
  const navigate = useNavigate();
  const { isAuthenticated, userType } = useAuthStore();

  const [_stats, setStats] = useState<Stats | null>(null);
  const [todayAppts, setTodayAppts] = useState<Appointment[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "completed">("all");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isManualBookOpen, setIsManualBookOpen] = useState(false);
  const [rescheduleData, setRescheduleData] = useState<{id: string, name: string} | null>(null);

  const fetchData = useCallback(async () => {
    try {
      // Format date to YYYY-MM-DD local time
      const dateStr = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000))
        .toISOString()
        .split("T")[0];

      const [statsRes, apptsRes, profileRes] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/dashboard/appointments", { params: { start_date: dateStr, end_date: dateStr } }),
        api.get("/dashboard/profile")
      ]);
      setStats(statsRes.data);
      setTodayAppts(apptsRes.data);
      setProfile(profileRes.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, selectedDate]);

  useEffect(() => {
    if (!isAuthenticated || !["doctor", "assistant"].includes(userType as string)) {
      navigate("/login");
      return;
    }
    fetchData();
  }, [isAuthenticated, userType, fetchData]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/dashboard/appointments/${id}/status`, { status });
      fetchData();
    } catch (err) {
      console.error("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="w-full">
        {/* Page Header Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-48" />
        </div>

        {/* Top Stats Row Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}
        </div>

        {/* Grid Layout Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <Skeleton className="h-7 w-48" />
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                  <Skeleton className="h-8 w-20 rounded-md" />
                  <Skeleton className="h-8 w-20 rounded-md" />
                  <Skeleton className="h-8 w-20 rounded-md" />
                </div>
              </div>
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 border rounded-xl flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div>
                        <Skeleton className="h-5 w-32 mb-1.5" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 h-[400px]">
              <Skeleton className="h-full w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredAppts = todayAppts.filter(apt => {
    if (activeTab === "upcoming") return apt.status === "pending" || apt.status === "confirmed";
    if (activeTab === "completed") return apt.status === "completed";
    return true;
  });

  const translateStatus = (status: string) => {
    switch (status) {
      case "pending": return "En attente";
      case "confirmed": return "Confirmé";
      case "completed": return "Terminé";
      case "cancelled": return "Annulé";
      case "no_show": return "Absent";
      default: return status;
    }
  };

  const apptsTotal = todayAppts.length;
  const apptsPending = todayAppts.filter(a => a.status === "pending").length;
  const apptsCompleted = todayAppts.filter(a => a.status === "completed").length;

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Bonjour, Dr. {profile?.first_name || ""}</h2>
        <p className="text-gray-500 text-lg mt-2">Voici votre programme pour aujourd'hui.</p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Appointments */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">Rendez-vous prévus</span>
            <span className="material-symbols-outlined text-blue-500 text-[20px]">calendar_clock</span>
          </div>
          <div className="flex items-end gap-1 mt-2">
            <span className="text-4xl font-extrabold text-gray-900 tracking-tight">{apptsTotal}</span>
          </div>
          <div className="text-xs text-gray-500 mt-2">Pour la date sélectionnée</div>
        </div>

        {/* Pending Confirmations */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">À confirmer</span>
            <span className="material-symbols-outlined text-orange-500 text-[20px]">pending_actions</span>
          </div>
          <div className="text-4xl font-extrabold text-gray-900 tracking-tight mt-2">{apptsPending}</div>
          <div className="flex items-center gap-1 text-orange-500 mt-2">
            <span className="text-xs font-medium">En attente de validation</span>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">Patients traités</span>
            <span className="material-symbols-outlined text-green-500 text-[20px]">check_circle</span>
          </div>
          <div className="text-4xl font-extrabold text-gray-900 tracking-tight mt-2">{apptsCompleted}</div>
          <div className="text-xs text-gray-500 mt-2">Consultations terminées</div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Column 1: Agenda du jour (Spans 8 cols on desktop) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Widget 1: Agenda */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            {/* Agenda Header & Tabs */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div className="flex items-center gap-4">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[24px]">view_agenda</span>
                  {selectedDate.toDateString() === new Date().toDateString() 
                    ? "Agenda du jour" 
                    : `Agenda du ${selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`}
                </h3>
                <button 
                  onClick={() => setIsManualBookOpen(true)}
                  className="hidden sm:flex text-sm font-medium text-white bg-primary px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors items-center gap-1 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Nouveau
                </button>
              </div>
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg self-stretch sm:self-auto overflow-x-auto">
                <button 
                  onClick={() => setActiveTab("all")}
                  className={`px-4 py-1.5 rounded-md text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === "all" ? "bg-white shadow-sm text-primary" : "text-gray-600 hover:bg-gray-200"}`}
                >Tous</button>
                <button 
                  onClick={() => setActiveTab("upcoming")}
                  className={`px-4 py-1.5 rounded-md text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === "upcoming" ? "bg-white shadow-sm text-primary" : "text-gray-600 hover:bg-gray-200"}`}
                >À venir</button>
                <button 
                  onClick={() => setActiveTab("completed")}
                  className={`px-4 py-1.5 rounded-md text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === "completed" ? "bg-white shadow-sm text-primary" : "text-gray-600 hover:bg-gray-200"}`}
                >Terminés</button>
              </div>
            </div>

            {/* Patient List */}
            <div className="space-y-4">
              {filteredAppts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Aucun rendez-vous pour aujourd'hui.</div>
              ) : (
                filteredAppts.map((apt) => (
                  <div key={apt.id} className="patient-card flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border border-gray-200 bg-white gap-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 text-primary font-medium px-3 py-1 rounded-md min-w-[70px] text-center">
                        {apt.appointment_time ? apt.appointment_time.substring(0, 5) : `#${apt.queue_number}`}
                      </div>
                      <div className={apt.status === "cancelled" || apt.status === "no_show" ? "opacity-60" : ""}>
                        <div className="flex items-center gap-2">
                          <h4 className={`text-lg font-medium text-gray-900 ${apt.status === "cancelled" ? "line-through" : ""}`}>
                            {apt.patient_name}
                          </h4>
                          {apt.is_new_patient && (
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full border border-blue-200">Nouveau</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <span className="material-symbols-outlined text-[16px]">call</span> {apt.patient_phone}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto justify-end mt-2 sm:mt-0 flex-wrap">
                      <button 
                        onClick={() => setRescheduleData({id: apt.id, name: apt.patient_name})}
                        className="flex items-center gap-1 px-4 py-2 rounded-lg border border-indigo-200 text-indigo-600 bg-white hover:bg-indigo-50 text-sm font-medium transition-colors"
                        title="Déplacer"
                      >
                        <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                        Déplacer
                      </button>
                      {apt.status === "pending" || apt.status === "confirmed" ? (
                        <>
                          <button 
                            onClick={() => handleUpdateStatus(apt.id, "cancelled")}
                            className="flex items-center gap-1 px-4 py-2 rounded-lg border border-red-200 text-red-600 bg-white hover:bg-red-50 text-sm font-medium transition-colors"
                            title="Annuler"
                          >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                            Annuler
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(apt.id, "completed")}
                            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">check</span>
                            Terminé
                          </button>
                        </>
                      ) : (
                        <span className={`text-sm px-3 py-1 rounded-full flex items-center gap-1 ${
                          apt.status === "completed" ? "text-green-700 bg-green-100" :
                          apt.status === "cancelled" ? "text-red-700 bg-red-100" :
                          apt.status === "no_show" ? "text-orange-700 bg-orange-100" :
                          "text-gray-500 bg-gray-100"
                        }`}>
                          {translateStatus(apt.status)}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}

              {todayAppts.length > 0 && (
                <button 
                  onClick={() => navigate("/dashboard/appointments")}
                  className="w-full py-2 text-center text-sm font-semibold text-primary hover:bg-primary/5 rounded-lg transition-colors mt-2"
                >
                  Voir tous les rendez-vous
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Column 2: Widgets (Spans 4 cols on desktop) */}
        <div className="lg:col-span-4 space-y-6">
          <AgendaWidget selectedDate={selectedDate} onSelectDate={(d) => d && setSelectedDate(d)} />
        </div>

      </div>

      <ManualBookingModal 
        isOpen={isManualBookOpen} 
        onClose={() => setIsManualBookOpen(false)} 
        onSuccess={fetchData} 
        initialDate={selectedDate} 
      />

      {rescheduleData && (
        <RescheduleModal
          isOpen={!!rescheduleData}
          onClose={() => setRescheduleData(null)}
          appointmentId={rescheduleData.id}
          patientName={rescheduleData.name}
          onSuccess={() => fetchData()}
        />
      )}
    </div>
  );
}
