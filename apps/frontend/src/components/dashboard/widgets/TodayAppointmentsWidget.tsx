import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, XCircle, UserPlus, CalendarDays } from "lucide-react";
import api from "../../../lib/api";
import { RescheduleModal } from "../RescheduleModal";

export function TodayAppointmentsWidget({ appointments = [], patientStats = {}, onStatusUpdate, onRefresh }: { appointments?: any[], patientStats?: Record<string, any>, onStatusUpdate?: () => void, onRefresh?: () => void }) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<"tous" | "avenir" | "termines" | "absents">("tous");
  const [rescheduleData, setRescheduleData] = useState<{id: string, name: string} | null>(null);

  const filteredAppointments = appointments.filter(apt => {
    if (filter === "tous") return true;
    if (filter === "avenir") return ["pending", "confirmed"].includes(apt.status);
    if (filter === "termines") return apt.status === "completed";
    if (filter === "absents") return apt.status === "no_show";
    return true;
  });

  const handleCancel = async (id: string) => {
    if (!window.confirm(t('widgets.confirmCancel'))) return;
    try {
      await api.patch(`/dashboard/appointments/${id}/status`, {
        status: "cancelled",
        cancellation_reason: "Annulé par le médecin"
      });
      if (onStatusUpdate) onStatusUpdate();
    } catch (err) {
      console.error("Failed to cancel appointment", err);
      alert(t('widgets.cancelError'));
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await api.patch(`/dashboard/appointments/${id}/status`, {
        status: "completed"
      });
      if (onStatusUpdate) onStatusUpdate();
    } catch (err) {
      console.error("Failed to complete appointment", err);
    }
  };

  const handleNoShow = async (id: string) => {
    try {
      await api.patch(`/dashboard/appointments/${id}/status`, {
        status: "no_show"
      });
      if (onStatusUpdate) onStatusUpdate();
    } catch (err) {
      console.error("Failed to mark no-show", err);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden h-full flex flex-col">
      <div className="px-6 py-5 border-b flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-gray-900">{t('widgets.todayAgenda')}</h2>
          </div>
          <span className="text-sm font-medium bg-gray-100 text-gray-700 px-3 py-1 rounded-full">{t('widgets.patientsCount', { count: appointments.length })}</span>
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mb-2">
          {[
            { id: "tous", label: t('widgets.all') },
            { id: "avenir", label: t('widgets.upcoming') },
            { id: "termines", label: t('widgets.completed') },
            { id: "absents", label: t('widgets.noShow') }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === tab.id 
                  ? "bg-primary text-white shadow-sm" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="p-0 flex-1 overflow-y-auto bg-gray-50/30">
        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <Calendar className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-lg">{t('widgets.noAppointmentsFound')}</p>
          </div>
        ) : (
          <div className="divide-y border-t">
            {filteredAppointments.map((apt) => {
              const stats = patientStats[apt.patient_phone];
              const showWarning = stats && stats.no_shows >= 2 && stats.rate > 0.4;
              
              return (
              <div key={apt.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors bg-white">
                <div className="flex items-start gap-4">
                  <div className="w-16 shrink-0 mt-1">
                    <span className="text-lg font-bold text-gray-900">
                      {apt.appointment_time?.substring(0, 5) || "File"}
                    </span>
                    {apt.queue_number && <p className="text-xs text-gray-500 font-medium mt-1">#{apt.queue_number}</p>}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-base font-bold text-gray-900">{apt.patient_name}</h4>
                      {apt.is_new_patient && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 uppercase tracking-wider">
                          <UserPlus className="h-3 w-3" /> {t('widgets.newPatient')}
                        </span>
                      )}
                      {showWarning && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 uppercase tracking-wider" title={`${Math.round(stats.rate * 100)}% ${t('widgets.noShowRate')}`}>
                          ⚠️ {stats.no_shows} {t('widgets.missedAppointments')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{apt.patient_phone}</p>
                    {apt.reason && <p className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block">{apt.reason}</p>}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 self-end sm:self-center">
                  <button 
                    onClick={() => setRescheduleData({id: apt.id, name: apt.patient_name})}
                    title={t('widgets.rescheduleApt')}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  >
                    <CalendarDays className="h-5 w-5" />
                  </button>
                  {/* Status Badges */}
                  {apt.status === "completed" && <span className="px-3 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-600">{t('widgets.completedBadge')}</span>}
                  {apt.status === "no_show" && <span className="px-3 py-1 rounded-md text-sm font-medium bg-red-50 text-red-700">{t('widgets.noShowBadge')}</span>}
                  {apt.status === "cancelled" && <span className="px-3 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-500 line-through">{t('widgets.cancelledBadge')}</span>}
                  
                  {/* Action Buttons for pending/confirmed */}
                  {["pending", "confirmed"].includes(apt.status) && (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleCancel(apt.id)}
                        title={t('widgets.cancelApt')}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <XCircle className="h-6 w-6" />
                      </button>
                      <button 
                        onClick={() => handleNoShow(apt.id)}
                        className="px-4 py-2 text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                      >
                        {t('widgets.noShowBadge')}
                      </button>
                      <button 
                        onClick={() => handleComplete(apt.id)}
                        className="px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors shadow-sm"
                      >
                        {t('widgets.completedBadge')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {rescheduleData && (
        <RescheduleModal
          isOpen={!!rescheduleData}
          onClose={() => setRescheduleData(null)}
          appointmentId={rescheduleData.id}
          patientName={rescheduleData.name}
          onSuccess={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}
