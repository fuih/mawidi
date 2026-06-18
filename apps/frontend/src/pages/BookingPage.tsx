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
      <div className="bg-gray-50 min-h-screen py-12 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg border max-w-md w-full text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Rendez-vous Enregistré !</h2>
          <p className="text-gray-600 mb-6">
            Votre demande a bien été enregistrée.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left border">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="capitalize text-gray-900 font-medium">{formattedDate}</span>
            </div>
            {isQueueMode && queueNumber !== null ? (
              <div className="flex items-center gap-3 mt-3">
                <Users className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-xs text-gray-500">Votre numéro dans la file</p>
                  <p className="text-3xl font-extrabold text-orange-500">#{queueNumber}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-gray-900 font-medium">{time}</span>
              </div>
            )}
          </div>

          {isQueueMode && (
            <p className="text-sm text-gray-500 mb-6">
              Vous serez reçu par ordre d'arrivée. Présentez-vous le jour J avec ce numéro.
            </p>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate(`/${identifier}`)}
              className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-[1.02]"
            >
              Voir le profil du médecin
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full text-gray-500 font-medium py-2 rounded-xl hover:text-gray-900 transition-colors"
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

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium text-gray-700">Prénom *</label>
                  <input
                    id="firstName" required type="text"
                    className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium text-gray-700">Nom *</label>
                  <input
                    id="lastName" required type="text"
                    className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-gray-700">Téléphone *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="phone" required type="tel" placeholder="0555..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">Email (optionnel)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="email" type="email"
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="reason" className="text-sm font-medium text-gray-700">Motif (optionnel)</label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <FileText className="h-4 w-4 text-gray-400" />
                  </div>
                  <textarea
                    id="reason" rows={3}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none resize-none"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <button
                  type="submit" disabled={isSubmitting}
                  className="w-full bg-primary text-white font-semibold py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
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
