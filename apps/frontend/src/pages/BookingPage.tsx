import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Calendar, Clock, User, Phone, Mail, FileText, CheckCircle2, Users } from "lucide-react";
import api from "../lib/api";
import { useAuthStore } from "../lib/authStore";

export function BookingPage() {
  const { identifier } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const date = searchParams.get("date");
  const time = searchParams.get("time");
  const mode = searchParams.get("mode"); // "queue" for queue-based mode

  const isQueueMode = mode === "queue";
  const { isAuthenticated, userType } = useAuthStore();
  const isPatient = isAuthenticated && userType === "patient";

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    reason: "",
  });
  const [patientLocked, setPatientLocked] = useState(false);

  const [doctor, setDoctor] = useState<any>(null);

  // When logged in as patient, fetch their profile and pre-fill the form
  // Fields remain editable so the person can book for a family member
  useEffect(() => {
    if (isPatient) {
      api.get("/auth/patient/me").then((res) => {
        setFormData((prev) => ({
          ...prev,
          firstName: res.data.first_name || "",
          lastName: res.data.last_name || "",
          phone: res.data.phone || "",
          email: res.data.email || "",
        }));
        setPatientLocked(true); // signals fields were pre-filled (not locked)
      }).catch(() => {});
    }

    if (identifier) {
      api.get(`/doctors/${identifier}/profile`).then((res) => {
        setDoctor(res.data);
      }).catch(() => {});
    }
  }, [isPatient, identifier]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [queueNumber, setQueueNumber] = useState<number | null>(null);
  const [error, setError] = useState("");

  if (!date || (!isQueueMode && (!time || time === "null"))) {
    navigate(`/${identifier}`);
    return null;
  }

  // Parse "YYYY-MM-DD" as local midnight (not UTC midnight) to avoid date rollback
  const formattedDate = new Date(`${date}T00:00`).toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const payload: Record<string, unknown> = {
        doctor_id: doctor?.id, // Backend needs the actual UUID! We must pass doctor.id, not identifier
        appointment_date: date,
        patient_name: `${formData.firstName} ${formData.lastName}`,
        patient_phone: formData.phone,
        patient_email: formData.email || null,
        reason: formData.reason || null,
      };

      if (!isQueueMode) {
        payload.appointment_time = time;
      }

      const res = await api.post("/appointments/book", payload);
      setQueueNumber(res.data.queue_number ?? null);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors de la réservation");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-[#F8FAFC] min-h-screen py-12 flex items-center justify-center relative overflow-hidden">
        {/* Ambient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#039D77]/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="bg-white/90 backdrop-blur-xl p-6 sm:p-10 rounded-3xl shadow-[0_8px_40px_rgb(17,33,66,0.08)] border border-white/50 max-w-md w-full mx-4 sm:mx-0 text-center relative z-10 animate-in zoom-in-95 duration-500">
          <div className="mx-auto w-20 h-20 bg-[#039D77]/10 rounded-full flex items-center justify-center mb-6 shadow-inner relative">
            <div className="absolute inset-0 rounded-full border-4 border-[#039D77]/20 animate-ping opacity-20"></div>
            <CheckCircle2 className="h-10 w-10 text-[#039D77]" />
          </div>
          <h2 className="text-2xl font-black text-[#112142] mb-3 tracking-tight">Rendez-vous Confirmé !</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Votre demande a été enregistrée avec succès. Vous recevrez une notification prochainement.
          </p>

          <div className="bg-gray-50/80 rounded-2xl p-5 mb-8 text-left border border-gray-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5 text-[#039D77]" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Date</p>
                <span className="capitalize text-[#112142] font-bold text-sm">{formattedDate}</span>
              </div>
            </div>
            {isQueueMode && queueNumber !== null ? (
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                <div className="w-10 h-10 rounded-full bg-orange-100 shadow-sm flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Numéro de file</p>
                  <p className="text-2xl font-black text-orange-500">#{queueNumber}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5 text-[#039D77]" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Heure</p>
                  <span className="text-[#112142] font-black text-xl">{time}</span>
                </div>
              </div>
            )}
          </div>

          {isQueueMode && (
            <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 mb-8 text-sm text-orange-800 text-left">
              Vous serez reçu par ordre d'arrivée. Présentez-vous le jour J au cabinet avec ce numéro.
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate(`/${identifier}`)}
              className="w-full bg-[#039D77] text-white font-bold py-3.5 rounded-xl hover:bg-[#027a5c] shadow-[0_8px_30px_rgb(3,157,119,0.2)] transition-all duration-300 hover:scale-[1.02]"
            >
              Retour au profil
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full text-gray-500 font-bold py-3.5 rounded-xl hover:text-[#112142] hover:bg-gray-50 transition-colors"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-12 font-sans relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <h1 className="text-3xl font-extrabold text-[#112142] mb-8 tracking-tight">Finaliser votre rendez-vous</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 bg-white/90 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-xl shadow-primary/5 border border-white/50">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
              <User className="h-6 w-6 text-primary" />
              Vos informations
            </h2>

            {isQueueMode && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex gap-3">
                <Users className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                <p className="text-sm text-orange-700">
                  Vous serez reçu par ordre d'arrivée. Votre numéro de file sera affiché après confirmation.
                </p>
              </div>
            )}

            {patientLocked && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex gap-3">
                <User className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  Informations pré-remplies depuis votre compte.{" "}
                  <span className="font-medium">
                    Vous réservez pour un membre de la famille ? Modifiez le nom et le téléphone ci-dessous.
                  </span>
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4 border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label htmlFor="firstName" className="text-[13px] font-bold text-gray-700 uppercase tracking-wide">Prénom *</label>
                  <input
                    id="firstName" required type="text"
                    className="w-full px-4 py-3.5 bg-gray-50/50 border-2 border-gray-100 rounded-xl focus:border-[#039D77] focus:bg-white outline-none transition-all duration-200 text-gray-900 font-medium"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="lastName" className="text-[13px] font-bold text-gray-700 uppercase tracking-wide">Nom *</label>
                  <input
                    id="lastName" required type="text"
                    className="w-full px-4 py-3.5 bg-gray-50/50 border-2 border-gray-100 rounded-xl focus:border-[#039D77] focus:bg-white outline-none transition-all duration-200 text-gray-900 font-medium"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="phone" className="text-[13px] font-bold text-gray-700 uppercase tracking-wide">Téléphone *</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400 group-focus-within:text-[#039D77] transition-colors" />
                  </div>
                  <input
                    id="phone" required type="tel" placeholder="0555..."
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border-2 border-gray-100 rounded-xl focus:border-[#039D77] focus:bg-white outline-none transition-all duration-200 text-gray-900 font-medium placeholder:font-normal placeholder:text-gray-400"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-[13px] font-bold text-gray-700 uppercase tracking-wide">Email <span className="text-gray-400 font-normal lowercase tracking-normal">(optionnel)</span></label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-[#039D77] transition-colors" />
                  </div>
                  <input
                    id="email" type="email" placeholder="votre@email.com"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border-2 border-gray-100 rounded-xl focus:border-[#039D77] focus:bg-white outline-none transition-all duration-200 text-gray-900 font-medium placeholder:font-normal placeholder:text-gray-400"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reason" className="text-[13px] font-bold text-gray-700 uppercase tracking-wide">Motif <span className="text-gray-400 font-normal lowercase tracking-normal">(optionnel)</span></label>
                <div className="relative group">
                  <div className="absolute top-4 left-4 pointer-events-none">
                    <FileText className="h-5 w-5 text-gray-400 group-focus-within:text-[#039D77] transition-colors" />
                  </div>
                  <textarea
                    id="reason" rows={3} placeholder="Pourquoi souhaitez-vous consulter ?"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border-2 border-gray-100 rounded-xl focus:border-[#039D77] focus:bg-white outline-none transition-all duration-200 text-gray-900 font-medium placeholder:font-normal placeholder:text-gray-400 resize-none"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <button
                  type="submit" disabled={isSubmitting}
                  className="w-full bg-[#039D77] text-white font-bold py-4 rounded-xl hover:bg-[#027a5c] transition-all duration-300 transform hover:scale-[1.01] shadow-[0_8px_30px_rgb(3,157,119,0.3)] disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Confirmation en cours...
                    </>
                  ) : (
                    isQueueMode ? "Confirmer ma place dans la file" : "Confirmer le rendez-vous"
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl shadow-primary/5 border border-white/50 sticky top-24">
              <h3 className="text-xs uppercase tracking-widest font-bold text-gray-500 mb-6">
                Résumé du rendez-vous
              </h3>

              <div className="space-y-5">
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div className="pt-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Date</p>
                    <p className="font-bold capitalize text-gray-900">{formattedDate}</p>
                  </div>
                </div>

                {isQueueMode ? (
                  <div className="flex gap-4 items-start">
                    <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-orange-200">
                      <Users className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="pt-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Mode</p>
                      <p className="font-medium text-gray-900">File d'attente</p>
                      <p className="text-xs text-gray-400 mt-0.5">Numéro attribué à la confirmation</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4 items-start">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-primary/10">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div className="pt-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Heure</p>
                      <p className="font-bold text-gray-900 text-xl">{time}</p>
                    </div>
                  </div>
                )}

                {doctor && (
                  <div className="pt-4 mt-4 border-t border-gray-100">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Médecin</p>
                        <p className="font-medium text-gray-900">Dr. {doctor.first_name} {doctor.last_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{doctor.specialty}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 mt-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Adresse</p>
                        <p className="font-medium text-gray-900 text-sm">{doctor.address || doctor.city}</p>
                        {doctor.google_maps_url && (
                          <a href={doctor.google_maps_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline mt-1.5 text-sm font-medium">
                            Voir sur la carte
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
