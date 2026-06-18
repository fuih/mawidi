import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  TrendingUp, 
  Users, 
  CalendarCheck, 
  CalendarX, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Activity,
  RefreshCw
} from "lucide-react";
import api from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";

interface DashboardStats {
  total: number;
  today: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  no_show: number;
  no_show_rate: number;
  fill_rate: number | null;
  avg_patients_per_day: number | null;
  weekly_chart: Array<{
    date: string;
    booked: number;
    completed: number;
    cancelled: number;
    no_show: number;
  }>;
}

export function StatsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, userType } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Date range state
  const todayDate = new Date().toISOString().split("T")[0];
  const lastWeekDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(lastWeekDate);
  const [endDate, setEndDate] = useState(todayDate);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/dashboard/stats", {
        params: {
          start_date: startDate || undefined,
          end_date: endDate || undefined
        }
      });
      setStats(res.data);
    } catch (err: any) {
      if (err.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate, startDate, endDate]);

  useEffect(() => {
    if (!isAuthenticated || !["doctor", "assistant"].includes(userType as string)) {
      navigate("/login");
      return;
    }
    fetchStats();
  }, [isAuthenticated, userType, fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p>Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const totalActionable = stats.completed + stats.no_show;
  const actualNoShowRate = totalActionable > 0 ? Math.round((stats.no_show / totalActionable) * 100) : 0;
  const completionRate = totalActionable > 0 ? Math.round((stats.completed / totalActionable) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header and Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Statistiques de votre cabinet
          </h1>
          <p className="text-sm text-gray-500 mt-1">Aperçu global de votre activité sur موعدي Mawidi</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
            <label className="text-sm text-gray-500 font-medium">Du</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-sm border-none focus:ring-0 p-0 text-gray-900 font-medium"
            />
            <label className="text-sm text-gray-500 font-medium ml-2">Au</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-sm border-none focus:ring-0 p-0 text-gray-900 font-medium"
            />
          </div>
          <button 
            onClick={fetchStats}
            className="p-2 text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-sm"
            title="Appliquer le filtre"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Rendez-vous Aujourd'hui" 
          value={stats.today.toString()} 
          icon={<Users className="h-6 w-6 text-blue-600" />} 
          bgClass="bg-blue-50"
        />
        <StatCard 
          title="Total des Rendez-vous" 
          value={stats.total.toString()} 
          icon={<Activity className="h-6 w-6 text-purple-600" />} 
          bgClass="bg-purple-50"
        />
        <StatCard 
          title="Taux d'Absence" 
          value={`${actualNoShowRate}%`} 
          icon={<AlertCircle className="h-6 w-6 text-red-600" />} 
          bgClass="bg-red-50"
        />
        {stats.fill_rate !== null ? (
          <StatCard 
            title="Taux de Remplissage" 
            value={`${stats.fill_rate}%`} 
            icon={<CalendarCheck className="h-6 w-6 text-green-600" />} 
            bgClass="bg-green-50"
          />
        ) : (
          <StatCard 
            title="Moy. Patients/Jour" 
            value={`${stats.avg_patients_per_day || "N/A"}`} 
            icon={<Users className="h-6 w-6 text-green-600" />} 
            bgClass="bg-green-50"
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Breakdown by Status */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Répartition par statut & Évolution</h2>
          
          <div className="space-y-5 mb-8">
            <ProgressBar label="En attente" value={stats.pending} total={stats.total} colorClass="bg-yellow-400" icon={<Clock className="h-4 w-4 text-yellow-600" />} />
            <ProgressBar label="Confirmés" value={stats.confirmed} total={stats.total} colorClass="bg-blue-500" icon={<CheckCircle2 className="h-4 w-4 text-blue-600" />} />
            <ProgressBar label="Terminés" value={stats.completed} total={stats.total} colorClass="bg-green-500" icon={<CheckCircle2 className="h-4 w-4 text-green-600" />} />
            <ProgressBar label="Annulés" value={stats.cancelled} total={stats.total} colorClass="bg-gray-400" icon={<CalendarX className="h-4 w-4 text-gray-600" />} />
            <ProgressBar label="Absents (No-show)" value={stats.no_show} total={stats.total} colorClass="bg-red-500" icon={<AlertCircle className="h-4 w-4 text-red-600" />} />
          </div>

          <h3 className="text-sm font-bold text-gray-700 mb-4">Évolution sur la période</h3>
          <SimpleChart data={stats.weekly_chart} />
        </div>

        {/* Performance Insights */}
        <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Performances</h2>
          
          <div className="flex-1 flex flex-col justify-center gap-8">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100" />
                  <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="351.85" strokeDashoffset={351.85 - (351.85 * completionRate) / 100} className="text-green-500 transition-all duration-1000 ease-out" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-bold text-gray-900">{completionRate}%</span>
                </div>
              </div>
              <h3 className="mt-4 font-semibold text-gray-700">Taux de réalisation</h3>
              <p className="text-xs text-gray-500 mt-1">Rendez-vous honorés par les patients</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border text-sm text-gray-600">
              <p className="font-medium text-gray-900 mb-1 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Conseil
              </p>
              Pour réduire le taux d'absence, assurez-vous que les rappels SMS automatiques sont activés dans vos paramètres.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SimpleChart({ data }: { data: DashboardStats["weekly_chart"] }) {
  if (!data || data.length === 0) return <p className="text-gray-500 text-sm">Aucune donnée pour cette période.</p>;
  
  const maxVal = Math.max(...data.map(d => Math.max(d.completed, d.cancelled, d.no_show, 1)));

  return (
    <div className="flex items-end justify-between gap-1 h-32 mt-4">
      {data.map((day, i) => {
        const hComp = `${(day.completed / maxVal) * 100}%`;
        const hCanc = `${(day.cancelled / maxVal) * 100}%`;
        const hNoSh = `${(day.no_show / maxVal) * 100}%`;
        const dateObj = new Date(day.date);
        const dayName = dateObj.toLocaleDateString("fr-FR", { weekday: 'short', day: 'numeric' });
        
        return (
          <div key={i} className="flex-1 flex flex-col justify-end items-center gap-1 relative group h-full">
            <div className="w-full flex justify-center items-end gap-0.5 h-full">
              {day.completed > 0 && <div className="w-1/3 bg-green-500 rounded-t-sm" style={{ height: hComp }}></div>}
              {day.no_show > 0 && <div className="w-1/3 bg-red-500 rounded-t-sm" style={{ height: hNoSh }}></div>}
              {day.cancelled > 0 && <div className="w-1/3 bg-gray-400 rounded-t-sm" style={{ height: hCanc }}></div>}
            </div>
            <span className="text-[10px] text-gray-500 capitalize">{dayName}</span>
            
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs p-2 rounded shadow-lg pointer-events-none z-10 whitespace-nowrap">
              <p className="font-bold mb-1">{dateObj.toLocaleDateString("fr-FR")}</p>
              <p className="text-green-400">Terminés: {day.completed}</p>
              <p className="text-red-400">Absents: {day.no_show}</p>
              <p className="text-gray-400">Annulés: {day.cancelled}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({ title, value, icon, bgClass }: { title: string, value: string, icon: React.ReactNode, bgClass: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 flex items-center gap-4">
      <div className={`p-4 rounded-xl ${bgClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, total, colorClass, icon }: { label: string, value: number, total: number, colorClass: string, icon: React.ReactNode }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <div className="flex items-center gap-2 font-medium text-gray-700">
          {icon}
          {label}
        </div>
        <div className="font-semibold text-gray-900">
          {value} <span className="text-gray-400 font-normal text-xs">({percentage}%)</span>
        </div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div 
          className={`h-2.5 rounded-full ${colorClass} transition-all duration-1000 ease-out`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
