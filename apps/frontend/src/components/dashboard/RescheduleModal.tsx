import { useState, useEffect } from "react";
import { X } from "lucide-react";
import api from "../../lib/api";

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  patientName: string;
  onSuccess: () => void;
}

export function RescheduleModal({ isOpen, onClose, appointmentId, patientName, onSuccess }: RescheduleModalProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookingMode, setBookingMode] = useState<"time_based" | "queue_based">("queue_based");
  const [error, setError] = useState<string | null>(null);

  // Fetch doctor profile to know booking mode when modal opens
  useEffect(() => {
    if (isOpen) {
      api.get("/dashboard/profile")
        .then(res => setBookingMode(res.data.booking_mode || "queue_based"))
        .catch(err => console.error(err));
    } else {
      // Reset state on close
      setDate("");
      setTime("");
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    
    setLoading(true);
    setError(null);
    try {
      await api.patch(`/dashboard/appointments/${appointmentId}/reschedule`, {
        appointment_date: date,
        appointment_time: bookingMode === "time_based" ? time : undefined
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors du déplacement du rendez-vous.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Déplacer le rendez-vous</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Déplacez le rendez-vous de <strong className="text-gray-900">{patientName}</strong> vers une nouvelle date.
            {bookingMode === "queue_based" && (
              <span className="block mt-2 text-primary font-medium">
                Note: Le patient recevra le prochain numéro de file disponible pour cette journée.
              </span>
            )}
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nouvelle date *</label>
            <input 
              type="date" 
              required
              min={new Date().toISOString().split("T")[0]}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border"
            />
          </div>

          {bookingMode === "time_based" && (
            <div className="space-y-2 mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nouvelle heure *</label>
              <input 
                type="time" 
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border"
              />
            </div>
          )}

          <div className="mt-6 pt-4 border-t flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !date || (bookingMode === "time_based" && !time)}
              className="px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Enregistrement..." : "Confirmer le déplacement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
