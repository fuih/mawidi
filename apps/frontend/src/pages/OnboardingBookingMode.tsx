import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import api from "../lib/api";

export function OnboardingBookingMode() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<"time_based" | "queue_based" | null>(null);
  const [maxQueue, setMaxQueue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleContinue = async () => {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      await api.patch("/dashboard/booking-mode", {
        booking_mode: selected,
        max_daily_queue: selected === "queue_based" && maxQueue ? parseInt(maxQueue) : null,
      });
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur, veuillez réessayer.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-orange-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenue sur موعدي Mawidi !
          </h1>
          <p className="text-gray-500 text-lg">
            Une dernière étape avant de commencer.
          </p>
          <p className="text-gray-600 font-medium mt-2">
            Comment souhaitez-vous recevoir vos patients ?
          </p>
        </div>

        {/* Mode Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
          {/* Time-based */}
          <button
            onClick={() => setSelected("time_based")}
            className={`relative p-6 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-md ${
              selected === "time_based"
                ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                : "border-gray-200 bg-white hover:border-primary/40"
            }`}
          >
            {selected === "time_based" && (
              <span className="absolute top-4 right-4 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </span>
            )}
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Créneau horaire</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Vos patients choisissent une <strong>heure précise</strong> parmi vos disponibilités.
              Idéal si chaque consultation a une durée fixe.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Agenda structuré</span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Durée définie</span>
            </div>
          </button>

          {/* Queue-based */}
          <button
            onClick={() => setSelected("queue_based")}
            className={`relative p-6 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-md ${
              selected === "queue_based"
                ? "border-orange-400 bg-orange-50 shadow-lg shadow-orange-100"
                : "border-gray-200 bg-white hover:border-orange-300"
            }`}
          >
            {selected === "queue_based" && (
              <span className="absolute top-4 right-4 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </span>
            )}
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-orange-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">File d'attente (numéro)</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Vos patients choisissent <strong>un jour</strong> et reçoivent un numéro.
              Ils sont servis dans l'ordre d'arrivée. Idéal si la durée varie.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">Flexible</span>
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">Ordre d'arrivée</span>
            </div>
          </button>
        </div>

        {/* Optional: daily cap for queue mode */}
        {selected === "queue_based" && (
          <div className="bg-white border border-orange-200 rounded-xl p-5 mb-6 transition-all">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Nombre maximum de patients par jour{" "}
              <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <input
              type="number"
              min={1}
              placeholder="Ex: 30 — laisser vide pour illimité"
              className="w-full sm:w-72 px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-orange-400/50 outline-none text-sm"
              value={maxQueue}
              onChange={(e) => setMaxQueue(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">
              Les réservations seront bloquées une fois ce nombre atteint.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4 border border-red-200">
            {error}
          </div>
        )}

        {/* Action */}
        <button
          onClick={handleContinue}
          disabled={!selected || saving}
          className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all duration-200 ${
            selected
              ? selected === "queue_based"
                ? "bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-200"
                : "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              Accéder à mon tableau de bord
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          Vous pourrez modifier ce choix à tout moment depuis vos paramètres.
        </p>
      </div>
    </div>
  );
}
