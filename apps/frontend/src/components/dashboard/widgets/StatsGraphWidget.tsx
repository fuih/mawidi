import { TrendingUp, Users, Activity, CheckCircle2 } from "lucide-react";

export function StatsGraphWidget({ stats }: { stats?: any }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden h-full flex flex-col">
      <div className="px-6 py-5 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Aperçu</h2>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-center">
        {stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
             <div className="bg-gray-50 p-6 rounded-xl border flex flex-col items-center justify-center text-center">
                <Users className="h-8 w-8 text-primary mb-3" />
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Aujourd'hui</p>
                <p className="text-4xl font-bold text-gray-900">{stats.today}</p>
             </div>
             <div className="bg-green-50 p-6 rounded-xl border border-green-100 flex flex-col items-center justify-center text-center">
                <CheckCircle2 className="h-8 w-8 text-green-600 mb-3" />
                <p className="text-sm font-medium text-green-800 uppercase tracking-wider mb-1">Remplissage</p>
                <p className="text-4xl font-bold text-green-700">{stats.fill_rate}%</p>
             </div>
             <div className="bg-orange-50 p-6 rounded-xl border border-orange-100 flex flex-col items-center justify-center text-center">
                <TrendingUp className="h-8 w-8 text-orange-600 mb-3" />
                <p className="text-sm font-medium text-orange-800 uppercase tracking-wider mb-1">Absences</p>
                <div className="flex items-center gap-1">
                  <p className="text-4xl font-bold text-orange-700">{stats.no_show_rate}%</p>
                  <span className="text-orange-500 font-bold text-xl">↓</span>
                </div>
             </div>
          </div>
        ) : (
          <div className="text-center text-gray-500">Chargement des statistiques...</div>
        )}
      </div>
    </div>
  );
}
