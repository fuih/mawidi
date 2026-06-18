import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertCircle, Calendar, Clock, MapPin, User, XCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import api from "../lib/api";

export function CancelAppointmentPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Lien invalide.");
      setLoading(false);
      return;
    }

    api.get(`/appointments/guest/${token}`)
      .then((res) => {
        setAppointment(res.data);
      })
      .catch((err) => {
        setError(err.response?.data?.detail || "Rendez-vous introuvable ou vous n'avez pas l'autorisation.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const [phone, setPhone] = useState("");

  const handleCancel = async () => {
    if (!phone || phone.length < 9) {
      setError("Veuillez entrer un numéro de téléphone valide.");
      return;
    }
    setCancelling(true);
    setError("");
    try {
      await api.patch(`/appointments/guest/${token}/cancel`, { phone });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Une erreur est survenue lors de l'annulation.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Chargement du rendez-vous...</p>
      </div>
    );
  }

  if (error && !appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Rendez-vous annulé</h2>
          <p className="text-gray-600 mb-8">
            L'annulation a bien été prise en compte et le médecin a été prévenu.
          </p>
          <button
            onClick={() => navigate("/")}
            className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const isAlreadyCancelled = appointment?.status === "cancelled";
  const dateObj = appointment?.appointment_date ? new Date(appointment.appointment_date) : new Date();
  const formattedDate = dateObj.toLocaleDateString("fr-FR", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          {/* Header */}
          <div className="bg-primary/5 p-6 border-b text-center">
            <h1 className="text-2xl font-bold text-gray-900">Gestion de votre rendez-vous</h1>
          </div>

          <div className="p-6 sm:p-8">
            {isAlreadyCancelled ? (
              <div className="bg-orange-50 text-orange-800 border border-orange-200 rounded-xl p-4 mb-6 flex gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="font-medium">Ce rendez-vous est déjà annulé.</p>
              </div>
            ) : (
              <p className="text-gray-600 mb-8 text-center">
                Voici les détails de votre réservation. Vous pouvez l'annuler si vous avez un empêchement.
              </p>
            )}

            {error && (
              <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4 mb-6">
                {error}
              </div>
            )}

            {/* Appointment Details */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8 border space-y-4">
              <div className="flex gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-500 font-medium">Médecin</p>
                  <p className="font-semibold text-gray-900">Dr. {appointment?.doctor_first_name} {appointment?.doctor_last_name}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-500 font-medium">Date</p>
                  <p className="text-gray-900 capitalize">{formattedDate}</p>
                </div>
              </div>

              {appointment?.appointment_time && (
                <div className="flex gap-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Heure</p>
                    <p className="text-gray-900">{appointment.appointment_time.slice(0, 5)}</p>
                  </div>
                </div>
              )}

              {appointment?.doctor_city && (
                <div className="flex gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Lieu</p>
                    <p className="text-gray-900">{appointment.doctor_city}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            {!isAlreadyCancelled && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border p-4 space-y-3">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Confirmez votre numéro de téléphone pour annuler
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="ex: 0550123456"
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
                
                <button
                  onClick={handleCancel}
                  disabled={cancelling || phone.length < 9}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 text-white font-semibold py-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-70"
                >
                  {cancelling ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                  Annuler définitivement ce rendez-vous
                </button>
                <p className="text-center text-sm text-gray-500 mt-4">
                  Cette action est irréversible. Le médecin sera immédiatement prévenu.
                </p>
              </div>
            )}
            
            {isAlreadyCancelled && (
              <button
                onClick={() => navigate("/")}
                className="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Retour à l'accueil
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
