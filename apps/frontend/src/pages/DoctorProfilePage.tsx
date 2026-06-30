import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Stethoscope, Calendar as CalendarIcon, Info, User, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import api, { getImageUrl } from "../lib/api";
import { Skeleton } from "../components/ui/Skeleton";

/** Format a Date as YYYY-MM-DD using local timezone (avoids UTC midnight rollback) */
const toLocalDateStr = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

interface DoctorProfile {
  id: string;
  first_name: string;
  last_name: string;
  first_name_ar: string | null;
  last_name_ar: string | null;
  specialty: string;
  city: string;
  address: string | null;
  bio: string | null;
  bio_ar: string | null;
  profile_photo_url: string | null;
  consultation_fee: number | null;
  booking_mode: string;
  google_maps_url?: string | null;
}

interface Slot {
  time: string;
  is_available: boolean;
}

interface SlotsResponse {
  date: string;
  doctor_id: string;
  slots: Slot[];
}

export function DoctorProfilePage() {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Date selection - generate next 30 days
  const dates = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [effectiveMode, setEffectiveMode] = useState<string>("time_based");
  
  // Weekly navigation state
  const [weekOffset, setWeekOffset] = useState(0);

  // Fetch doctor profile
  useEffect(() => {
    const fetchDoctor = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/doctors/${identifier}/profile`);
        setDoctor(res.data);
      } catch {
        setError(t('doctorProfile.notFound'));
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [identifier]);

  // When date changes: first fetch the effective mode for that date, then fetch slots if needed
  useEffect(() => {
    if (!doctor) return;

    const dateStr = toLocalDateStr(selectedDate);
    setSelectedSlot(null);
    setSlots([]);

    const fetchModeAndSlots = async () => {
      setSlotsLoading(true);
      try {
        // 1. Get effective mode for this specific date
        const modeRes = await api.get(`/doctors/${identifier}/booking-mode-for-date`, {
          params: { date: dateStr },
        });
        const mode: string = modeRes.data.effective_mode;
        setEffectiveMode(mode);

        // 2. Fetch slots unconditionally to verify working hours and availability
        const slotsRes = await api.get<SlotsResponse>(`/doctors/${identifier}/available-slots`, {
          params: { date: dateStr },
        });
        setSlots(slotsRes.data.slots);
      } catch {
        setEffectiveMode(doctor.booking_mode);
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchModeAndSlots();
  }, [identifier, selectedDate, doctor]);

  if (loading) {
    return (
      <div className="bg-[#F8FAFC] min-h-screen pb-12 font-sans relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] bg-blue-400/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 relative z-10">
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl shadow-primary/5 border border-white/50 mb-8">
            <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start text-center sm:text-left">
              <Skeleton className="h-36 w-36 shrink-0 rounded-full border-4 border-white shadow-lg" />
              <div className="flex-1 pt-2 w-full">
                <Skeleton className="h-9 w-3/4 max-w-[300px] mb-4 mx-auto sm:mx-0" />
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                  <Skeleton className="h-8 w-32 rounded-full" />
                  <Skeleton className="h-6 w-48" />
                </div>
              </div>
            </div>
            <div className="mt-8 border-t pt-6">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-[90%] mb-2" />
              <Skeleton className="h-4 w-[80%]" />
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl shadow-primary/5 border border-white/50">
             <Skeleton className="h-8 w-64 mb-8 mx-auto" />
             <Skeleton className="h-20 w-full mb-8 rounded-xl" />
             <Skeleton className="h-48 w-full mb-8 rounded-xl" />
             <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">{error || t('doctorProfile.error')}</p>
      </div>
    );
  }

  const isQueueMode = effectiveMode === "queue_based";
  const availableSlots = slots.filter((s) => s.is_available);
  const selectedDateStr = toLocalDateStr(selectedDate);

  // In queue mode, can book if the doctor works and has at least one valid future slot
  const isWorkingDay = slots.length > 0;
  const canBook = isQueueMode ? availableSlots.length > 0 : !!selectedSlot;

  // Generate JSON-LD schema
  const schemaOrg = {
    "@context": "https://schema.org",
    "@type": "Physician",
    "name": `Dr. ${doctor?.first_name} ${doctor?.last_name}`,
    "medicalSpecialty": doctor?.specialty,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": doctor?.city,
      "streetAddress": doctor?.address || ""
    },
    "image": doctor?.profile_photo_url ? getImageUrl(doctor.profile_photo_url) : undefined
  };

  const currentWeekDates = dates.slice(weekOffset * 7, weekOffset * 7 + 7);
  const maxWeekOffset = Math.ceil(dates.length / 7) - 1;

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-12 font-sans relative overflow-hidden">
      {/* Dynamic SEO Title & Schema */}
      <title>Dr. {doctor.first_name} {doctor.last_name} - {doctor.specialty} à {doctor.city} | Tabibi</title>
      <script type="application/ld+json">
        {JSON.stringify(schemaOrg)}
      </script>

      {/* Ultra-clean Ambient Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] bg-blue-400/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 relative z-10">
        
        {/* Profile Header Card */}
        <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-10 rounded-3xl shadow-xl shadow-primary/5 border border-white/50 mb-8">
          <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start text-center sm:text-left">
            <div className="h-36 w-36 shrink-0 overflow-hidden rounded-full border-4 border-white shadow-lg shadow-gray-200/50 bg-gray-50 flex items-center justify-center transform transition-transform hover:scale-105 duration-300">
              {doctor.profile_photo_url ? (
                <img src={getImageUrl(doctor.profile_photo_url)} alt={doctor.last_name} className="h-full w-full object-cover" />
              ) : (
                <User className="h-14 w-14 text-gray-300" />
              )}
            </div>

            <div className="flex-1 pt-2">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Dr. {doctor.first_name} {doctor.last_name}
              </h1>
              {doctor.first_name_ar && (
                <p className="text-lg text-gray-600 mb-5" dir="rtl">
                  د. {doctor.first_name_ar} {doctor.last_name_ar}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                  <Stethoscope className="h-4 w-4" />
                  <span>{doctor.specialty}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{doctor.address || doctor.city}</span>
                </div>
                {doctor.google_maps_url && (
                  <a href={doctor.google_maps_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-4 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full text-sm font-medium transition-colors">
                    {t('doctorProfile.seeOnMap')}
                  </a>
                )}
                {isQueueMode && (
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-orange-50 text-orange-600 rounded-full text-sm font-semibold border border-orange-200">
                    <Users className="h-4 w-4" />
                    <span>{t('doctorProfile.queueMode')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {doctor.bio && (
            <div className="mt-10 border-t border-gray-100 pt-8 text-start">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center justify-center sm:justify-start gap-2">
                <Info className="h-5 w-5 text-gray-400" />
                {t('doctorProfile.presentation')}
              </h3>
              <p className="text-gray-600 leading-relaxed">{doctor.bio}</p>
              {doctor.bio_ar && (
                <p className="text-gray-600 leading-relaxed mt-4 text-right" dir="rtl">{doctor.bio_ar}</p>
              )}
            </div>
          )}
        </div>

        {/* Booking Widget */}
        <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-10 rounded-3xl shadow-xl shadow-primary/5 border border-white/50">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-gray-900 flex items-center justify-center gap-3">
              <CalendarIcon className="h-7 w-7 text-primary" />
              {t('doctorProfile.bookAppointment')}
            </h2>
            <p className="text-gray-500 mt-2">{t('doctorProfile.bookSubtitle')}</p>
          </div>

          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm font-black text-gray-800 uppercase tracking-widest">{t('doctorProfile.step1')}</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))} 
                  disabled={weekOffset === 0}
                  className={`p-2 rounded-full border transition-colors ${weekOffset === 0 ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => setWeekOffset(Math.min(maxWeekOffset, weekOffset + 1))} 
                  disabled={weekOffset === maxWeekOffset}
                  className={`p-2 rounded-full border transition-colors ${weekOffset === maxWeekOffset ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {currentWeekDates.map((d) => {
                const isSelected = toLocalDateStr(d) === toLocalDateStr(selectedDate);
                return (
                  <button
                    key={d.toISOString()}
                    onClick={() => setSelectedDate(d)}
                    className={`flex flex-col items-center justify-center py-4 rounded-[1.25rem] border-2 transition-all duration-300 transform ${
                      isSelected 
                        ? "bg-[#039D77] text-white border-[#039D77] shadow-[0_8px_30px_rgb(3,157,119,0.3)] scale-105" 
                        : "bg-white text-gray-500 border-transparent hover:border-[#039D77]/30 hover:bg-[#039D77]/5 hover:scale-[1.02]"
                    }`}
                  >
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider opacity-80 mb-1">
                      {d.toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : i18n.language === 'en' ? 'en-US' : 'fr-FR', { weekday: "short" }).replace('.', '')}
                    </span>
                    <span className="text-lg sm:text-2xl font-black">{d.getDate()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-10 min-h-[150px]">
            {slotsLoading ? (
              <div className="animate-in fade-in duration-200">
                <p className="text-sm font-black text-gray-800 uppercase tracking-widest mb-6 text-start">{t('doctorProfile.step2')}</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-[46px] rounded-xl" />
                  ))}
                </div>
              </div>
            ) : !isWorkingDay ? (
              <div className="text-center p-8 bg-red-50/50 rounded-2xl border border-red-100 animate-in fade-in duration-200">
                <p className="text-red-800 font-bold text-lg mb-1">{t('doctorProfile.notAvailableTitle')}</p>
                <p className="text-red-600">{t('doctorProfile.notAvailableDesc')}</p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center p-8 bg-gray-50 rounded-2xl border border-gray-200 animate-in fade-in duration-200">
                <p className="text-gray-800 font-bold text-lg mb-1">{t('doctorProfile.fullTitle')}</p>
                <p className="text-gray-600">{t('doctorProfile.fullDesc')}</p>
              </div>
            ) : isQueueMode ? (
              <div className="text-center p-8 bg-orange-50/50 rounded-2xl border border-orange-100 animate-in fade-in duration-200">
                <Users className="h-12 w-12 text-orange-400 mx-auto mb-4" />
                <p className="text-orange-800 font-bold text-lg mb-1">{t('doctorProfile.queueConsultationTitle')}</p>
                <p className="text-orange-600">{t('doctorProfile.queueConsultationDesc')}</p>
              </div>
            ) : (
              <div className="animate-in fade-in duration-200">
                <p className="text-sm font-black text-gray-800 uppercase tracking-widest mb-6 text-start">{t('doctorProfile.step2')}</p>
                {/* Single unified grid as requested (no categories) */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {slots.map((s) => (
                    <button
                      key={s.time}
                      disabled={!s.is_available}
                      onClick={() => setSelectedSlot(s.time)}
                      className={`py-3.5 text-sm font-bold rounded-[1.15rem] border-2 transition-all duration-200 transform-gpu ${
                        !s.is_available
                          ? "bg-gray-50 text-gray-300 border-transparent cursor-not-allowed"
                          : selectedSlot === s.time
                          ? "bg-[#039D77] text-white border-[#039D77] shadow-[0_8px_30px_rgb(3,157,119,0.3)] scale-105"
                          : "bg-white text-[#112142] border-gray-100 hover:border-[#039D77] hover:text-[#039D77] hover:bg-transparent hover:scale-[1.02]"
                      }`}
                    >
                      {s.time.substring(0, 5)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            disabled={!canBook}
            onClick={() => {
              const url = isQueueMode
                ? `/${identifier}/book?date=${selectedDateStr}&mode=queue`
                : `/${identifier}/book?date=${selectedDateStr}&time=${selectedSlot}`;
              navigate(url);
            }}
            className={`block w-full py-5 rounded-2xl text-center font-bold text-lg transition-all duration-300 transform ${
              canBook
                ? "bg-primary text-white hover:bg-primary/90 shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95"
                : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
            }`}
          >
            {isQueueMode ? t('doctorProfile.reserveQueue') : t('doctorProfile.continue')}
          </button>
        </div>
      </div>
    </div>
  );
}
