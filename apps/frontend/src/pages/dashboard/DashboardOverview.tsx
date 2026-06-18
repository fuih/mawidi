import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";

// Widgets
import { TodayAppointmentsWidget } from "../../components/dashboard/widgets/TodayAppointmentsWidget";
import { QuickActionsWidget } from "../../components/dashboard/widgets/QuickActionsWidget";
import { StatsGraphWidget } from "../../components/dashboard/widgets/StatsGraphWidget";
import { AgendaWidget } from "../../components/dashboard/widgets/AgendaWidget";

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

export function DashboardOverview() {
  const navigate = useNavigate();
  const { isAuthenticated, userType } = useAuthStore();

  const [stats, setStats] = useState<Stats | null>(null);
  const [todayAppts, setTodayAppts] = useState<Appointment[]>([]);
  const [patientStats, setPatientStats] = useState<Record<string, any>>({});
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, todayRes, profileRes] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/dashboard/appointments/today"),
        api.get("/dashboard/profile")
      ]);
      setStats(statsRes.data);
      // Backend returns { appointments, patient_stats }
      if (todayRes.data && todayRes.data.appointments) {
          setTodayAppts(todayRes.data.appointments);
          setPatientStats(todayRes.data.patient_stats || {});
      } else {
          // Fallback if backend hasn't updated yet
          setTodayAppts(todayRes.data);
      }
      setProfile(profileRes.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!isAuthenticated || !["doctor", "assistant"].includes(userType as string)) {
      navigate("/login");
      return;
    }
    fetchData();
  }, [isAuthenticated, userType, fetchData]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Chargement du tableau de bord...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          Bonjour Dr. {profile?.first_name || ""} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">Voici un aperçu de votre activité aujourd'hui.</p>
      </div>

      {/* Mobile-first Stack / Desktop Grid */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
        
        {/* Hero Section: Today's Appointments */}
        <div className="lg:col-span-2 order-1 h-full min-h-[600px] lg:h-auto">
          <TodayAppointmentsWidget 
            appointments={todayAppts} 
            patientStats={patientStats}
            onStatusUpdate={fetchData} 
          />
        </div>

        {/* Context & Actions Column */}
        <div className="lg:col-span-1 order-2 flex flex-col gap-6">
          <QuickActionsWidget onActionComplete={fetchData} />
          <StatsGraphWidget stats={stats} />
          <AgendaWidget selectedDate={new Date()} onSelectDate={() => {}} />
        </div>

      </div>
    </div>
  );
}
