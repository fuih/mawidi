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
  const [error, setError] = useState<string | null>(null);
  const [bookingMode, setBookingMode] = useState<"time_based" | "queue_based">("queue_based");
  const [doctorId, setDoctorId] = useState("");
  
  // Format initial date if provided, otherwise use today
  const defaultDateStr = initialDate 
    ? new Date(initialDate.getTime() - (initialDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    patient_name: "",
    patient_phone: "",
    reason: "",
    appointment_date: defaultDateStr,
    appointment_time: ""
  });

  const [slots, setSlots] = useState<{time: string, is_available: boolean}[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.get("/dashboard/profile").then(res => {
        setDoctorId(res.data.id);
        setBookingMode(res.data.booking_mode || "queue_based");
      }).catch(err => console.error("Failed to fetch profile", err));
    } else {
      setFormData({
        patient_name: "",
        patient_phone: "",
        reason: "",
        appointment_date: defaultDateStr,
        appointment_time: ""
      });
      setSlots([]);
      setDoctorId("");
      setError(null);
    }
  }, [isOpen, defaultDateStr]);

  useEffect(() => {
    if (!formData.appointment_date || !doctorId) return;
    
    setSlotsLoading(true);
    setSlots([]);
    setFormData(prev => ({ ...prev, appointment_time: "" }));
    
    const fetchModeAndSlots = async () => {
      try {
        const modeRes = await api.get(`/doctors/${doctorId}/booking-mode-for-date`, { params: { date: formData.appointment_date } });
        setBookingMode(modeRes.data.effective_mode);
        
        if (modeRes.data.effective_mode === "time_based") {
            const slotsRes = await api.get(`/doctors/${doctorId}/available-slots`, { params: { date: formData.appointment_date } });
            setSlots(slotsRes.data.slots);
        }
      } catch (err) {
        console.error("Error fetching slots", err);
      } finally {
        setSlotsLoading(false);
      }
    };
    
    fetchModeAndSlots();
  }, [formData.appointment_date, doctorId]);

  if (!isOpen) return null;

  const handleManualBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
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
      setError(err.response?.data?.detail || "Erreur lors de l'ajout du rendez-vous.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Nouveau Rendez-vous Manuel</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleManualBook} className="p-6 pt-4 space-y-4">
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
          
          <div className="space-y-4">
            <div className={bookingMode === "queue_based" ? "w-full" : ""}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input 
                type="date"
                required
                min={new Date().toISOString().split("T")[0]}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border"
                value={formData.appointment_date}
                onChange={e => setFormData({...formData, appointment_date: e.target.value})}
              />
            </div>
            
            {bookingMode === "time_based" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Heure *</label>
                {slotsLoading ? (
                  <div className="w-full rounded-lg border-gray-300 bg-gray-50 text-gray-400 p-2.5 border text-sm animate-pulse">
                    Chargement des créneaux...
                  </div>
                ) : slots.filter(s => s.is_available).length > 0 ? (
                  <select 
                    required
                    value={formData.appointment_time}
                    onChange={(e) => setFormData({...formData, appointment_time: e.target.value})}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border bg-white"
                  >
                    <option value="">-- Sélectionnez une heure --</option>
                    {slots.filter(s => s.is_available).map(s => (
                        <option key={s.time} value={s.time}>{s.time.substring(0, 5)}</option>
                    ))}
                  </select>
                ) : formData.appointment_date ? (
                  <div className="text-red-600 text-sm font-medium p-3 border border-red-200 rounded-lg bg-red-50 text-center">
                    Aucun créneau disponible à cette date.
                  </div>
                ) : (
                  <div className="w-full rounded-lg border-gray-200 bg-gray-50 text-gray-400 p-2.5 border text-sm text-center">
                    Veuillez choisir une date d'abord
                  </div>
                )}
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
              disabled={isSubmitting || (bookingMode === "time_based" && !formData.appointment_time)}
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
