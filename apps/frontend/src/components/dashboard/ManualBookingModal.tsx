import { useState, useEffect } from "react";
import { X } from "lucide-react";
import api from "../../lib/api";

interface ManualBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDate?: Date;
}

export function ManualBookingModal({ isOpen, onClose, onSuccess, initialDate }: ManualBookingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingMode, setBookingMode] = useState<"time_based" | "queue_based">("time_based");
  
  // Format initial date if provided, otherwise use today
  const defaultDateStr = initialDate 
    ? new Date(initialDate.getTime() - (initialDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    patient_name: "",
    patient_phone: "",
    reason: "",
    appointment_date: defaultDateStr,
    appointment_time: new Date().toTimeString().slice(0, 5)
  });

  useEffect(() => {
    if (isOpen) {
      api.get("/dashboard/profile").then(res => {
        setBookingMode(res.data.booking_mode || "time_based");
      }).catch(err => console.error("Failed to fetch profile", err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // If queue mode, omit the appointment time
    const payload = { ...formData };
    if (bookingMode === "queue_based") {
      delete (payload as any).appointment_time;
    }

    try {
      await api.post("/dashboard/appointments/manual-book", payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Erreur lors de l'ajout du rendez-vous.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Nouveau Rendez-vous Manuel</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleManualBook} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du patient *</label>
            <input 
              required
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border"
              value={formData.patient_name}
              onChange={e => setFormData({...formData, patient_name: e.target.value})}
              placeholder="Ex: Ali Maiche"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
            <input 
              required
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border"
              value={formData.patient_phone}
              onChange={e => setFormData({...formData, patient_phone: e.target.value})}
              placeholder="05..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motif (Optionnel)</label>
            <input 
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border"
              value={formData.reason}
              onChange={e => setFormData({...formData, reason: e.target.value})}
              placeholder="Consultation de suivi"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className={bookingMode === "queue_based" ? "col-span-2" : ""}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input 
                type="date"
                required
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border"
                value={formData.appointment_date}
                onChange={e => setFormData({...formData, appointment_date: e.target.value})}
              />
            </div>
            {bookingMode === "time_based" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Heure (si applicable)</label>
                <input 
                  type="time"
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border"
                  value={formData.appointment_time}
                  onChange={e => setFormData({...formData, appointment_time: e.target.value})}
                />
              </div>
            )}
          </div>
          <div className="mt-6 pt-4 border-t flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border transition-colors"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-lg disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? "Enregistrement..." : "Confirmer le RDV"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
