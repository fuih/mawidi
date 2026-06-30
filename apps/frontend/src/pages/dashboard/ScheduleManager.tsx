import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Clock, Save, AlertCircle, Plus, Trash2, CalendarX, Users, Ban, RefreshCw } from "lucide-react";
import api from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";

/** Local-timezone YYYY-MM-DD (avoids UTC midnight rollback) */
const localToday = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const DAYS = [
  { id: 0, key: "monday" },
  { id: 1, key: "tuesday" },
  { id: 2, key: "wednesday" },
  { id: 3, key: "thursday" },
  { id: 4, key: "friday" },
  { id: 5, key: "saturday" },
  { id: 6, key: "sunday" },
];

export function ScheduleManager() {
  const navigate = useNavigate();
  const { isAuthenticated, userType } = useAuthStore();
  const { t, i18n } = useTranslation();

  const [schedule, setSchedule] = useState(
    DAYS.map((d) => ({
      day: d.id,
      isActive: d.id < 4, // Mon-Thu active by default
      start: "09:00",
      end: "16:00",
      duration: 30,
    }))
  );
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Booking mode state
  const [bookingMode, setBookingMode] = useState<"time_based" | "queue_based">("time_based");
  const [maxDailyQueue, setMaxDailyQueue] = useState<string>("");
  const [queueCutoffTime, setQueueCutoffTime] = useState<string>("");
  const [isSavingMode, setIsSavingMode] = useState(false);
  const [modeMessage, setModeMessage] = useState("");

  // Today queue status
  const [todayClosed, setTodayClosed] = useState(false);
  const [togglingToday, setTogglingToday] = useState(false);

  // Blocked slots state
  const [blockedSlots, setBlockedSlots] = useState<any[]>([]);
  const [newBlockDate, setNewBlockDate] = useState("");
  const [newBlockStart, setNewBlockStart] = useState("");
  const [newBlockEnd, setNewBlockEnd] = useState("");
  const [newBlockReason, setNewBlockReason] = useState("");
  const [isAddingBlock, setIsAddingBlock] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !["doctor", "assistant"].includes(userType as string)) {
      navigate("/login");
      return;
    }

    const fetchSchedule = async () => {
      try {
        const res = await api.get("/dashboard/working-hours");
        if (res.data.length > 0) {
          // Merge API data into the default schedule
          const apiMap = new Map<number, any>();
          for (const wh of res.data) {
            apiMap.set(wh.day_of_week, wh);
          }
          setSchedule(
            DAYS.map((d) => {
              const existing = apiMap.get(d.id);
              if (existing) {
                return {
                  day: d.id,
                  isActive: existing.is_active ?? true,
                  start: existing.start_time?.substring(0, 5) || "09:00",
                  end: existing.end_time?.substring(0, 5) || "16:00",
                  duration: existing.slot_duration_minutes || 30,
                };
              }
              return { day: d.id, isActive: false, start: "09:00", end: "16:00", duration: 30 };
            })
          );
        }
        
        // Fetch blocked slots
        const blocksRes = await api.get("/blocked-slots");
        setBlockedSlots(blocksRes.data);

        // Fetch current booking mode from profile
        const profileRes = await api.get("/dashboard/profile");
        if (profileRes.data.booking_mode) {
          setBookingMode(profileRes.data.booking_mode);
          setMaxDailyQueue(profileRes.data.max_daily_queue?.toString() || "");
          setQueueCutoffTime(profileRes.data.queue_cutoff_time?.substring(0, 5) || "");
        }

        // Check if today is already closed
        const today = localToday();
        const isClosed = blocksRes.data.some(
          (b: any) => b.blocked_date === today && !b.start_time && !b.end_time
        );
        setTodayClosed(isClosed);
      } catch {}
      setLoading(false);
    };
    fetchSchedule();
  }, [isAuthenticated, userType, navigate]);

  const toggleDay = (dayId: number) => {
    setSchedule(schedule.map((s) => (s.day === dayId ? { ...s, isActive: !s.isActive } : s)));
  };

  const updateTime = (dayId: number, field: "start" | "end", value: string) => {
    setSchedule(schedule.map((s) => (s.day === dayId ? { ...s, [field]: value } : s)));
  };

  const updateDuration = (dayId: number, value: number) => {
    setSchedule(schedule.map((s) => (s.day === dayId ? { ...s, duration: value } : s)));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage("");

    try {
      const payload = schedule
        .filter((s) => s.isActive)
        .map((s) => ({
          day_of_week: s.day,
          start_time: s.start + ":00",
          end_time: s.end + ":00",
          slot_duration_minutes: s.duration,
          is_active: true,
        }));

      await api.put("/dashboard/working-hours", payload);
      setMessage(t('scheduleManager.scheduleSaved'));
    } catch (err: any) {
      setMessage(t('scheduleManager.errorPrefix') + (err.response?.data?.detail || t('scheduleManager.saveFailed')));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBookingMode = async () => {
    setIsSavingMode(true);
    setModeMessage("");
    try {
      await api.patch("/dashboard/booking-mode", {
        booking_mode: bookingMode,
        max_daily_queue: maxDailyQueue ? parseInt(maxDailyQueue) : null,
        queue_cutoff_time: queueCutoffTime || null,
      });
      setModeMessage(t('scheduleManager.bookingModeUpdated'));
    } catch (err: any) {
      setModeMessage(t('scheduleManager.errorPrefix') + (err.response?.data?.detail || t('scheduleManager.impossible')));
    } finally {
      setIsSavingMode(false);
    }
  };

  const handleToggleToday = async () => {
    setTogglingToday(true);
    try {
      if (todayClosed) {
        await api.delete("/dashboard/queue-close-today");
        setTodayClosed(false);
        // Remove from blocked slots list
        const today = localToday();
        setBlockedSlots((prev) => prev.filter((b) => !(b.blocked_date === today && !b.start_time)));
      } else {
        const res = await api.post("/dashboard/queue-close-today");
        setTodayClosed(true);
        if (res.data.status !== "already_closed") {
          const today = localToday();
          setBlockedSlots((prev) => [{ id: "today-block", blocked_date: today, start_time: null, end_time: null, reason: t('scheduleManager.queueClosedByDoctor') }, ...prev]);
        }
      }
    } catch (err: any) {
      alert(t('scheduleManager.errorPrefix') + (err.response?.data?.detail || t('scheduleManager.impossible')));
    } finally {
      setTogglingToday(false);
    }
  };

  const handleAddBlockedSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingBlock(true);
    try {
      const payload: any = { blocked_date: newBlockDate };
      if (newBlockStart && newBlockEnd) {
        payload.start_time = newBlockStart + ":00";
        payload.end_time = newBlockEnd + ":00";
      }
      if (newBlockReason) payload.reason = newBlockReason;

      const res = await api.post("/blocked-slots", payload);
      setBlockedSlots([res.data, ...blockedSlots]);
      setNewBlockDate("");
      setNewBlockStart("");
      setNewBlockEnd("");
      setNewBlockReason("");
    } catch (err: any) {
      alert(t('scheduleManager.errorPrefix') + (err.response?.data?.detail || t('scheduleManager.impossibleToAddBlock')));
    } finally {
      setIsAddingBlock(false);
    }
  };

  const handleDeleteBlockedSlot = async (id: string) => {
    if (!confirm(t('scheduleManager.confirmDeleteBlock'))) return;
    try {
      await api.delete(`/blocked-slots/${id}`);
      setBlockedSlots(blockedSlots.filter((b) => b.id !== id));
    } catch (err) {
      alert(t('scheduleManager.deleteError'));
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">{t('scheduleManager.loading')}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-start">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{t('scheduleManager.scheduleManagement')}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {bookingMode === "queue_based"
              ? t('scheduleManager.queueSubtitle')
              : t('scheduleManager.timeSubtitle')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Schedule & Blocked Slots) */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Horaires Section */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Clock className="h-6 w-6 text-primary" />
                {t('scheduleManager.recurringSchedule')}
              </h2>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 bg-[#039D77] text-white px-6 py-3 rounded-xl font-bold shadow-[0_8px_30px_rgb(3,157,119,0.3)] hover:bg-[#027a5c] hover:scale-[1.02] transition-all disabled:opacity-70 disabled:hover:scale-100 text-sm"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {t('scheduleManager.save')}
              </button>
            </div>

            {message && (
              <div className={`p-4 rounded-xl text-sm font-medium border flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-4 ${message.startsWith("Erreur") ? "bg-red-50 text-red-700 border-red-100" : "bg-primary/5 text-primary border-primary/10"}`}>
                <div className={`w-2 h-2 rounded-full ${message.startsWith("Erreur") ? "bg-red-500" : "bg-primary"}`}></div>
                {message}
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3 text-sm text-yellow-800 shadow-sm text-start">
              <AlertCircle className="h-5 w-5 shrink-0 text-yellow-600" />
              <p>{t('scheduleManager.scheduleWarning')}</p>
            </div>

            <div className="bg-white rounded-3xl shadow-[0_8px_40px_rgb(17,33,66,0.04)] border border-gray-100 divide-y overflow-hidden transition-all hover:shadow-[0_8px_40px_rgb(17,33,66,0.08)]">
              {DAYS.map((day) => {
                const config = schedule.find((s) => s.day === day.id)!;

                return (
                  <div key={day.id} className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-4 w-40">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={config.isActive}
                          onChange={() => toggleDay(day.id)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                      <span className={`font-semibold ${config.isActive ? "text-gray-900" : "text-gray-400"}`}>
                        {t(`scheduleManager.days.${day.key}`)}
                      </span>
                    </div>

                    {config.isActive ? (
                      <div className="flex-1 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={config.start}
                            onChange={(e) => updateTime(day.id, "start", e.target.value)}
                            className="bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all shadow-sm"
                          />
                          <span className="text-gray-400 font-medium">{t('scheduleManager.to')}</span>
                          <input
                            type="time"
                            value={config.end}
                            onChange={(e) => updateTime(day.id, "end", e.target.value)}
                            className="bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all shadow-sm"
                          />
                        </div>

                        {/* Slot duration — only relevant in time-based mode */}
                        {bookingMode === "time_based" && (
                          <div className="hidden sm:flex items-center gap-2 border-l pl-4 ml-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <select
                              value={config.duration}
                              onChange={(e) => updateDuration(day.id, Number(e.target.value))}
                              className="bg-white border border-gray-300 rounded-md px-2 py-1.5 text-sm font-medium focus:ring-2 focus:ring-primary/50 outline-none shadow-sm cursor-pointer"
                            >
                              <option value={15}>15 {t('scheduleManager.min')}</option>
                              <option value={20}>20 {t('scheduleManager.min')}</option>
                              <option value={30}>30 {t('scheduleManager.min')}</option>
                              <option value={45}>45 {t('scheduleManager.min')}</option>
                              <option value={60}>60 {t('scheduleManager.min')}</option>
                            </select>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{t('scheduleManager.closed')}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Blocked Slots Section */}
          <div className="pt-2">
            <div className="mb-5 pb-2 border-b">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <CalendarX className="h-6 w-6 text-primary" />
                {t('scheduleManager.holidaysUnavailability')}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {t('scheduleManager.blockDescription')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="order-2 md:order-1">
                {blockedSlots.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300 shadow-sm">
                    <CalendarX className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">{t('scheduleManager.noBlocks')}</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl shadow-[0_8px_40px_rgb(17,33,66,0.04)] border border-gray-100 divide-y overflow-hidden">
                    {blockedSlots.map((slot) => (
                      <div key={slot.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                        <div>
                          <p className="font-semibold text-gray-900 capitalize">
                            {new Date(slot.blocked_date).toLocaleDateString("fr-FR", {
                              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                            })}
                          </p>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {slot.start_time && slot.end_time
                              ? <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {t('scheduleManager.from')} {slot.start_time.substring(0, 5)} {t('scheduleManager.to')} {slot.end_time.substring(0, 5)}</span>
                              : <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md text-xs font-medium">{t('scheduleManager.allDay')}</span>}
                            {slot.reason && <span className="text-gray-400"> • {slot.reason}</span>}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteBlockedSlot(slot.id)}
                          className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                          title={t('scheduleManager.delete')}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="order-1 md:order-2">
                <form onSubmit={handleAddBlockedSlot} className="bg-white p-6 sm:p-8 rounded-3xl shadow-[0_8px_40px_rgb(17,33,66,0.04)] border border-gray-100 space-y-5 text-start">
                  <h3 className="font-semibold text-gray-900 border-b pb-2 mb-4">{t('scheduleManager.addBlock')}</h3>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('scheduleManager.date')} <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      required
                      value={newBlockDate}
                      onChange={(e) => setNewBlockDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('scheduleManager.fromOptional')}</label>
                      <input
                        type="time"
                        value={newBlockStart}
                        onChange={(e) => setNewBlockStart(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('scheduleManager.toOptional')}</label>
                      <input
                        type="time"
                        value={newBlockEnd}
                        onChange={(e) => setNewBlockEnd(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('scheduleManager.reasonOptional')}</label>
                    <input
                      type="text"
                      placeholder={t('scheduleManager.reasonPlaceholder')}
                      value={newBlockReason}
                      onChange={(e) => setNewBlockReason(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isAddingBlock || !newBlockDate}
                    className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:bg-gray-800 disabled:opacity-50 transition-colors mt-2"
                  >
                    {isAddingBlock ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Plus className="h-4 w-4" />}
                    {t('scheduleManager.addToCalendar')}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-6">
          
          {/* Booking Mode Card */}
          <div className="bg-white rounded-3xl shadow-[0_8px_40px_rgb(17,33,66,0.04)] border border-gray-100 p-6 sm:p-8 sticky top-6 text-start">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-gray-900">{t('scheduleManager.bookingMode')}</h2>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              {t('scheduleManager.bookingModeDesc')}
            </p>

            <div className="flex flex-col gap-3 mb-6">
              <button
                onClick={() => setBookingMode("time_based")}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  bookingMode === "time_based"
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-gray-100 hover:border-gray-200 bg-gray-50/50"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`p-1.5 rounded-lg ${bookingMode === "time_based" ? "bg-primary text-white" : "bg-gray-200 text-gray-500"}`}>
                    <Clock className="h-4 w-4" />
                  </div>
                  <span className={`font-bold ${bookingMode === "time_based" ? "text-primary" : "text-gray-700"}`}>{t('scheduleManager.timeSlot')}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {t('scheduleManager.timeSlotDesc')}
                </p>
              </button>

              <button
                onClick={() => setBookingMode("queue_based")}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  bookingMode === "queue_based"
                    ? "border-orange-500 bg-orange-50 shadow-sm"
                    : "border-gray-100 hover:border-gray-200 bg-gray-50/50"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`p-1.5 rounded-lg ${bookingMode === "queue_based" ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                    <Users className="h-4 w-4" />
                  </div>
                  <span className={`font-bold ${bookingMode === "queue_based" ? "text-orange-600" : "text-gray-700"}`}>{t('scheduleManager.queue')}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {t('scheduleManager.queueDesc')}
                </p>
              </button>
            </div>

            {bookingMode === "queue_based" && (
              <div className="space-y-5 mb-6 p-5 bg-white border-2 border-orange-100 rounded-xl shadow-sm text-start">
                <h3 className="font-semibold text-orange-800 flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  {t('scheduleManager.queueSettings')}
                </h3>
                
                {/* Max daily patients */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                    {t('scheduleManager.maxPatientsPerDay')}
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder={t('scheduleManager.unlimitedIfEmpty')}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 outline-none text-sm transition-all"
                    value={maxDailyQueue}
                    onChange={(e) => setMaxDailyQueue(e.target.value)}
                  />
                </div>

                {/* Cutoff time */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                    {t('scheduleManager.autoCloseQueue')}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 transition-all"
                      value={queueCutoffTime}
                      onChange={(e) => setQueueCutoffTime(e.target.value)}
                    />
                    {queueCutoffTime && (
                      <button
                        type="button"
                        onClick={() => setQueueCutoffTime("")}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title={t('scheduleManager.clearTime')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1.5">
                    {t('scheduleManager.blocksNewTickets')}
                  </p>
                </div>

                {/* Close Today button */}
                <div className="pt-4 border-t border-orange-100">
                  <button
                    type="button"
                    onClick={handleToggleToday}
                    disabled={togglingToday}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm ${
                      todayClosed
                        ? "bg-green-500 text-white hover:bg-green-600"
                        : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 hover:border-red-300"
                    }`}
                  >
                    {togglingToday ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : todayClosed ? (
                      <RefreshCw className="h-4 w-4" />
                    ) : (
                      <Ban className="h-4 w-4" />
                    )}
                    {todayClosed ? t('scheduleManager.openQueueToday') : t('scheduleManager.closeQueueToday')}
                  </button>
                  {todayClosed && (
                    <p className="mt-2 text-xs text-center text-red-600 font-semibold bg-red-50 py-1.5 rounded-md border border-red-100">
                      {t('scheduleManager.queueClosedWarning')}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={handleSaveBookingMode}
                disabled={isSavingMode}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-800 transition-all shadow-sm disabled:opacity-70 text-sm"
              >
                {isSavingMode ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save className="h-4 w-4" />}
                {t('scheduleManager.applyMode')}
              </button>
              {modeMessage && (
                <div className={`mt-3 p-2 rounded-lg text-xs font-medium text-center ${modeMessage.startsWith("Erreur") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
                  {modeMessage}
                </div>
              )}
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
}
