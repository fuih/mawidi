import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Stethoscope, Calendar as CalendarIcon, Info, User, Users } from "lucide-react";
import api, { getImageUrl } from "../lib/api";

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
  // effectiveMode is per-date: may differ from doctor.booking_mode during transitions
  const [effectiveMode, setEffectiveMode] = useState<string>("time_based");

  // Fetch doctor profile
  useEffect(() => {
    const fetchDoctor = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/doctors/${identifier}/profile`);
        setDoctor(res.data);
      } catch {
        setError("Médecin introuvable");
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">{error || "Erreur"}</p>
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

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-12 font-sans relative overflow-hidden">
      {/* Dynamic SEO Title & Schema */}
      {doctor && (
        <title>Dr. {doctor.first_name} {doctor.last_name} - {doctor.specialty} à {doctor.city} | Tabibi</title>
      )}
      <script type="application/ld+json">
        {JSON.stringify(schemaOrg)}
      </script>

      {/* Ultra-clean Ambient Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] bg-blue-400/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left - Doctor Info */}
          <div className="flex-1 space-y-6">
            <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-xl shadow-primary/5 border border-white/50">
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
                    <p className="text-lg text-gray-600 mb-4" dir="rtl">
                      د. {doctor.first_name_ar} {doctor.last_name_ar}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      <Stethoscope className="h-4 w-4" />
                      <span>{doctor.specialty}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{doctor.address || doctor.city}</span>
                      {doctor.google_maps_url && (
                        <a href={doctor.google_maps_url} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center gap-1 text-primary hover:underline font-medium">
                          Voir sur la carte
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                        </a>
                      )}
                    </div>
                    {isQueueMode && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-sm font-medium border border-orange-200">
                        <Users className="h-4 w-4" />
                        <span>File d'attente</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {doctor.bio && (
                <div className="mt-8 border-t pt-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Info className="h-5 w-5 text-gray-400" />
                    Présentation
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm">{doctor.bio}</p>
                  {doctor.bio_ar && (
                    <p className="text-gray-600 leading-relaxed text-sm mt-4 text-right" dir="rtl">{doctor.bio_ar}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right - Booking Form Component */}
          <div className="w-full lg:w-96 shrink-0">
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl shadow-primary/5 border border-white/50 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <CalendarIcon className="h-6 w-6 text-primary" />
                Prendre rendez-vous
              </h2>

              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Étape 1: Choisissez la date</p>
                <div className="flex gap-3 overflow-x-auto pb-4 pt-1 snap-x no-scrollbar">
                  {dates.map((d) => {
                    const isSelected = toLocalDateStr(d) === toLocalDateStr(selectedDate);
                    return (
                      <button
                        key={d.toISOString()}
                        onClick={() => setSelectedDate(d)}
                        className={`snap-start shrink-0 w-20 p-3 rounded-xl border flex flex-col items-center justify-center transition-all duration-300 transform ${
                          isSelected 
                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/30 scale-105" 
                            : "bg-white text-gray-600 border-gray-200 hover:border-primary/50 hover:bg-primary/5 hover:scale-105"
                        }`}
                      >
                        <span className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">
                          {d.toLocaleDateString("fr-FR", { weekday: "short" })}
                        </span>
                        <span className="text-2xl font-black">{d.getDate()}</span>
                        <span className="text-xs font-medium mt-1 opacity-80">
                          {d.toLocaleDateString("fr-FR", { month: "short" })}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Availability section based on mode */}
              <div className="mb-8 min-h-[150px]">
                {slotsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : !isWorkingDay ? (
                  <div className="text-center p-6 bg-red-50/50 rounded-xl border border-red-100 transition-all duration-500 animate-in fade-in zoom-in-95">
                    <p className="text-red-800 font-semibold mb-1">Non disponible</p>
                    <p className="text-sm text-red-600">Le médecin ne consulte pas ce jour-là.</p>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200 transition-all duration-500 animate-in fade-in zoom-in-95">
                    <p className="text-gray-800 font-semibold mb-1">Complet ou Terminé</p>
                    <p className="text-sm text-gray-600">Aucun créneau disponible pour le reste de la journée.</p>
                  </div>
                ) : isQueueMode ? (
                  <div className="text-center p-6 bg-orange-50/50 rounded-xl border border-orange-100 transition-all duration-500 animate-in fade-in zoom-in-95">
                    <Users className="h-10 w-10 text-orange-400 mx-auto mb-3" />
                    <p className="text-orange-800 font-semibold mb-1">Consultation sans RDV</p>
                    <p className="text-sm text-orange-600">Vous recevrez un numéro de file après validation.</p>
                  </div>
                ) : (
                  <div className="transition-all duration-500 animate-in fade-in zoom-in-95">
                    <p className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Étape 2: L'heure</p>
                    <div className="grid grid-cols-3 gap-3">
                      {slots.map((s) => (
                        <button
                          key={s.time}
                          disabled={!s.is_available}
                          onClick={() => setSelectedSlot(s.time)}
                          className={`p-2.5 text-sm font-bold rounded-xl border transition-all duration-300 transform ${
                            !s.is_available
                              ? "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed opacity-50"
                              : selectedSlot === s.time
                              ? "bg-primary text-white border-primary shadow-lg shadow-primary/30 scale-105"
                              : "bg-white text-gray-700 border-gray-200 hover:border-primary/50 hover:text-primary hover:bg-primary/5 hover:scale-105"
                          }`}
                        >
                          {s.time.substring(0, 5)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action */}
              <button
                disabled={!canBook}
                onClick={() => {
                  const url = isQueueMode
                    ? `/${identifier}/book?date=${selectedDateStr}&mode=queue`
                    : `/${identifier}/book?date=${selectedDateStr}&time=${selectedSlot}`;
                  navigate(url);
                }}
                className={`block w-full py-4 rounded-xl text-center font-bold text-lg transition-all duration-300 transform ${
                  canBook
                    ? "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25 hover:scale-[1.02]"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                }`}
              >
                {isQueueMode ? "Réserver ma place" : "Continuer"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
