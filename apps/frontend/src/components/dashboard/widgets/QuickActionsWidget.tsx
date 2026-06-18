import { useState } from "react";
import { PlusCircle, Ban, PauseCircle, X } from "lucide-react";
import api from "../../../lib/api";

export function QuickActionsWidget({ onActionComplete }: { onActionComplete?: () => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    patient_name: "",
    patient_phone: "",
    reason: "",
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: new Date().toTimeString().slice(0,5)
  });

  const handleBlockRestOfDay = async () => {
    if (!window.confirm("Voulez-vous bloquer toutes les réservations pour le reste de la journée ?")) return;
    try {
      await api.post("/dashboard/block-rest-of-day");
      alert("Le reste de la journée a été bloqué.");
      if (onActionComplete) onActionComplete();
    } catch (err) {
      alert("Erreur lors du blocage.");
    }
  };

  const handlePauseBookings = async () => {
    if (!window.confirm("Voulez-vous suspendre la file d'attente pour aujourd'hui ?")) return;
    try {
      await api.post("/dashboard/queue-close-today");
      alert("La file d'attente est suspendue.");
      if (onActionComplete) onActionComplete();
    } catch (err: any) {
      if (err.response?.data?.status === "already_closed") {
        alert("La file est déjà suspendue.");
      } else {
        alert("Erreur lors de la suspension.");
      }
    }
  };

  const handleManualBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post("/dashboard/appointments/manual-book", formData);
      setIsModalOpen(false);
      setFormData({ ...formData, patient_name: "", patient_phone: "", reason: "" });
      if (onActionComplete) onActionComplete();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Erreur lors de l'ajout du rendez-vous.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden h-full flex flex-col">
        <div className="px-6 py-5 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Actions Rapides</h2>
        </div>
        
        <div className="p-6 flex-1 flex flex-col gap-3 justify-center">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors text-left group"
          >
            <div>
              <p className="font-bold text-primary">Prendre un RDV manuel</p>
              <p className="text-xs text-primary/70 mt-0.5">Ajouter un patient (ex: appel téléphonique)</p>
            </div>
            <PlusCircle className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
          </button>

          <button 
            onClick={handleBlockRestOfDay}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 transition-colors text-left group"
          >
            <div>
              <p className="font-bold text-red-700">Bloquer le reste de la journée</p>
              <p className="text-xs text-red-600/70 mt-0.5">Urgence, départ anticipé</p>
            </div>
            <Ban className="h-6 w-6 text-red-600 group-hover:scale-110 transition-transform" />
          </button>

          <button 
            onClick={handlePauseBookings}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 transition-colors text-left group"
          >
            <div>
              <p className="font-bold text-orange-700">Suspendre les réservations</p>
              <p className="text-xs text-orange-600/70 mt-0.5">Fermer la file pour aujourd'hui</p>
            </div>
            <PauseCircle className="h-6 w-6 text-orange-600 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Manual Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Nouveau Rendez-vous Manuel</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input 
                    type="date"
                    required
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border"
                    value={formData.appointment_date}
                    onChange={e => setFormData({...formData, appointment_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heure (si applicable)</label>
                  <input 
                    type="time"
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border"
                    value={formData.appointment_time}
                    onChange={e => setFormData({...formData, appointment_time: e.target.value})}
                  />
                </div>
              </div>
              <div className="mt-6 pt-4 border-t flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-lg disabled:opacity-50"
                >
                  {isSubmitting ? "Enregistrement..." : "Confirmer le RDV"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
