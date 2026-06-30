import { useState, useEffect, useCallback } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { fr, arDZ, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import "react-day-picker/dist/style.css";
import "../../../index.css"; // Ensure standard tailwind is there
import api from "../../../lib/api";

interface AgendaWidgetProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export function AgendaWidget({ selectedDate, onSelectDate }: AgendaWidgetProps) {
  const { t, i18n } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState<Date>(selectedDate);
  const [monthlyCounts, setMonthlyCounts] = useState<Record<string, number>>({});

  const fetchMonthlyCounts = useCallback(async (month: Date) => {
    try {
      const res = await api.get("/dashboard/appointments/monthly-counts", {
        params: {
          year: month.getFullYear(),
          month: month.getMonth() + 1
        }
      });
      setMonthlyCounts(res.data);
    } catch (err) {
      console.error("Failed to fetch monthly counts", err);
    }
  }, []);

  useEffect(() => {
    fetchMonthlyCounts(currentMonth);
  }, [currentMonth, fetchMonthlyCounts]);

  // Real data function for clients count
  const getClientsCount = (d: Date) => {
    const dateStr = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
    return monthlyCounts[dateStr] || 0;
  };

  const currentLocale = i18n.language === 'ar' ? arDZ : i18n.language === 'en' ? enUS : fr;

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden h-full flex flex-col">
      <style>{`
        .rdp {
          --rdp-cell-size: 40px;
          --rdp-accent-color: #0d9488;
          --rdp-background-color: #f0fdfa;
          margin: 0;
          width: 100%;
        }
        .rdp-months { width: 100%; }
        .rdp-month { width: 100%; }
        .rdp-table { width: 100%; max-width: 100%; }
        .rdp-head_cell { font-size: 0.875rem; font-weight: 600; color: #6b7280; text-transform: capitalize; padding-bottom: 1rem; }
        .rdp-cell { text-align: center; padding: 0.5rem 0; }
        .rdp-button:hover:not([disabled]):not(.rdp-day_selected) { background-color: #f3f4f6; }
        .rdp-day_selected, .rdp-day_selected:focus-visible, .rdp-day_selected:hover { background-color: var(--rdp-accent-color); color: white; }
        .rdp-day_today:not(.rdp-day_selected) { font-weight: bold; color: var(--rdp-accent-color); }
      `}</style>
      
      {/* Header */}
      <div className="px-6 py-5 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">{t('widgets.agenda')}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border px-3 py-1.5 rounded-md transition-colors"
            onClick={() => {
              onSelectDate(new Date());
              setCurrentMonth(new Date());
            }}
          >
            {t('widgets.todayBtn')}
          </button>
        </div>
      </div>

      {/* Calendar Area */}
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex-1 overflow-auto flex justify-center">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={(d) => d && onSelectDate(d)}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            locale={currentLocale}
            showOutsideDays
            className="w-full max-w-full"
            components={{
              IconLeft: () => <ChevronLeft className="h-4 w-4" />,
              IconRight: () => <ChevronRight className="h-4 w-4" />,
              DayContent: (props) => {
                const count = getClientsCount(props.date);
                
                // Color based on count
                let dotColor = "bg-primary";
                if (count > 5) dotColor = "bg-red-500";
                else if (count > 2) dotColor = "bg-orange-500";

                return (
                  <div className="flex flex-col items-center justify-center h-full w-full relative pt-1">
                    <span>{props.date.getDate()}</span>
                    <div className="flex gap-[2px] mt-0.5 min-h-[4px]">
                      {count > 0 && Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                        <div key={i} className={`w-1 h-1 rounded-full ${dotColor}`} />
                      ))}
                    </div>
                  </div>
                );
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
