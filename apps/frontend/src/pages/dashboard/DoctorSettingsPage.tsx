import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Camera, Loader2, User, Stethoscope, MapPin, Image as ImageIcon } from "lucide-react";
import api, { getImageUrl } from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";

export function DoctorSettingsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, userType } = useAuthStore();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    first_name_ar: "",
    last_name_ar: "",
    phone: "",
    specialty: "",
    city: "",
    address: "",
    bio: "",
    bio_ar: "",
    consultation_fee: "",
    google_maps_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");

  useEffect(() => {
    if (!isAuthenticated || userType !== "doctor") {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await api.get("/dashboard/profile");
        const p = res.data;
        setForm({
          first_name: p.first_name || "",
          last_name: p.last_name || "",
          first_name_ar: p.first_name_ar || "",
          last_name_ar: p.last_name_ar || "",
          phone: p.phone || "",
          specialty: p.specialty || "",
          city: p.city || "",
          address: p.address || "",
          bio: p.bio || "",
          bio_ar: p.bio_ar || "",
          consultation_fee: p.consultation_fee?.toString() || "",
          google_maps_url: p.google_maps_url || "",
        });
        setPhotoUrl(p.profile_photo_url || null);
      } catch {}
      setLoading(false);
    };
    fetchProfile();
  }, [isAuthenticated, userType, navigate]);

  const set = (field: string, value: string) => setForm({ ...form, [field]: value });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const payload: any = { ...form };
      payload.consultation_fee = form.consultation_fee ? Number(form.consultation_fee) : null;
      // Remove empty optional strings
      if (!payload.first_name_ar) delete payload.first_name_ar;
      if (!payload.last_name_ar) delete payload.last_name_ar;
      if (!payload.address) delete payload.address;
      if (!payload.google_maps_url) delete payload.google_maps_url;
      if (!payload.bio) delete payload.bio;
      if (!payload.bio_ar) delete payload.bio_ar;

      await api.put("/dashboard/profile", payload);
      setMessage("Profil mis à jour avec succès !");
      
      // Auto clear success message after 3 seconds
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setMessage("Erreur: " + (err.response?.data?.detail || "Échec"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Chargement de votre profil...</p>
      </div>
    );
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      setPhotoError("La taille de l'image ne doit pas dépasser 4 Mo.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoError("Format non supporté. Utilisez JPEG, PNG ou WebP.");
      return;
    }

    setPhotoError("");
    setUploadingPhoto(true);

    const objectUrl = URL.createObjectURL(file);
    const previousPhotoUrl = photoUrl;
    setPhotoUrl(objectUrl);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/dashboard/profile/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPhotoUrl(res.data.profile_photo_url);
      URL.revokeObjectURL(objectUrl);
    } catch (err: any) {
      setPhotoError(err.response?.data?.detail || "Erreur lors de l'upload de la photo.");
      setPhotoUrl(previousPhotoUrl);
      URL.revokeObjectURL(objectUrl);
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Paramètres du profil</h1>
          <p className="text-sm text-gray-500 mt-1">Gérez vos informations publiques et personnalisez votre page médecin.</p>
        </div>
        
        {/* Top Save Button for quick access */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="hidden sm:flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm hover:bg-primary/90 transition-all disabled:opacity-70"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium border flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-4 ${message.startsWith("Erreur") ? "bg-red-50 text-red-700 border-red-100" : "bg-primary/5 text-primary border-primary/10"}`}>
          <div className={`w-2 h-2 rounded-full ${message.startsWith("Erreur") ? "bg-red-500" : "bg-primary"}`}></div>
          {message}
        </div>
      )}

      {photoError && (
        <div className="p-4 rounded-xl text-sm font-medium border bg-red-50 text-red-700 border-red-100 shadow-sm">
          {photoError}
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Main Form) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section: Informations Personnelles */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden transition-all hover:shadow-md">
            <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-500" />
              <div>
                <h3 className="font-semibold text-gray-900">Identité</h3>
                <p className="text-xs text-gray-500">Vos informations personnelles.</p>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prénom</label>
                  <input type="text" value={form.first_name} onChange={(e) => set("first_name", e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="Amine" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom</label>
                  <input type="text" value={form.last_name} onChange={(e) => set("last_name", e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="Benali" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 text-right">الاسم (عربي)</label>
                  <input type="text" dir="rtl" value={form.first_name_ar} onChange={(e) => set("first_name_ar", e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-right" placeholder="أمين" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 text-right">اللقب (عربي)</label>
                  <input type="text" dir="rtl" value={form.last_name_ar} onChange={(e) => set("last_name_ar", e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-right" placeholder="بن علي" />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Informations Professionnelles */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden transition-all hover:shadow-md">
            <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-gray-500" />
              <div>
                <h3 className="font-semibold text-gray-900">Profil Professionnel</h3>
                <p className="text-xs text-gray-500">Spécialité, tarif et présentation aux patients.</p>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Spécialité</label>
                  <input type="text" value={form.specialty} onChange={(e) => set("specialty", e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="Ex: Cardiologie" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tarif de consultation (DA)</label>
                  <div className="relative">
                    <input type="number" min="0" step="100" value={form.consultation_fee} onChange={(e) => set("consultation_fee", e.target.value)}
                      className="w-full pl-4 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="2000" />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400 font-medium text-sm">
                      DA
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Biographie (français)</label>
                  <textarea rows={4} value={form.bio} onChange={(e) => set("bio", e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none" 
                    placeholder="Décrivez votre parcours, vos diplômes et votre approche médicale..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 text-right">السيرة الذاتية (عربي)</label>
                  <textarea rows={4} dir="rtl" value={form.bio_ar} onChange={(e) => set("bio_ar", e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-right" 
                    placeholder="...صف مسيرتك المهنية، شهاداتك ونهجك الطبي" />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Contact & Localisation */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden transition-all hover:shadow-md">
            <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-500" />
              <div>
                <h3 className="font-semibold text-gray-900">Cabinet & Contact</h3>
                <p className="text-xs text-gray-500">Où et comment vos patients peuvent vous joindre.</p>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Numéro de téléphone</label>
                  <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium" placeholder="0555 12 34 56" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ville / Wilaya</label>
                  <input type="text" value={form.city} onChange={(e) => set("city", e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="Ex: Alger" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Adresse complète du cabinet</label>
                <input type="text" value={form.address} onChange={(e) => set("address", e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="N° 15, Rue Emir Abdelkader, Bâtiment A..." />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Lien Google Maps</label>
                <input type="url" value={form.google_maps_url} onChange={(e) => set("google_maps_url", e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="https://goo.gl/maps/..." />
                <p className="text-xs text-gray-500 mt-1">Collez le lien vers votre position exacte sur Google Maps pour aider les patients à vous trouver.</p>
              </div>
            </div>
          </div>

          {/* Bottom Actions - Left Column */}
          <div className="flex items-center justify-end pt-2 gap-4">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-6 py-3 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit" disabled={saving}
              className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 hover:bg-primary/90 transition-all disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="h-5 w-5" />
              )}
              Enregistrer
            </button>
          </div>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-6">
          
          {/* Section: Photo de Profil */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden transition-all hover:shadow-md sticky top-6">
            <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-900">Photo de profil</h3>
            </div>
            <div className="p-6 flex flex-col items-center text-center">
              <div className="relative group mb-5">
                <div className="h-32 w-32 rounded-full bg-primary/5 flex items-center justify-center text-primary text-4xl font-bold border-4 border-white shadow-lg ring-1 ring-gray-100 overflow-hidden transition-transform group-hover:scale-105">
                  {photoUrl ? (
                    <img src={getImageUrl(photoUrl)} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <>{[form.first_name?.[0], form.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?'}</>
                  )}
                  
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-sm">
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    </div>
                  )}
                </div>
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute bottom-1 right-1 h-10 w-10 bg-white rounded-full border shadow-md flex items-center justify-center text-gray-600 hover:text-primary hover:border-primary transition-all disabled:opacity-50 hover:scale-110"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handlePhotoChange} 
                  accept="image/jpeg, image/png, image/webp" 
                  className="hidden" 
                />
              </div>
              
              <h4 className="text-sm font-semibold text-gray-900 mb-1">Télécharger une nouvelle photo</h4>
              <p className="text-xs text-gray-500 mb-4 px-2">Une photo professionnelle aide les patients à vous reconnaître et augmente la confiance. Formats : JPEG, PNG, WebP. Taille max : 4 Mo.</p>
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full text-sm font-medium text-primary hover:bg-primary/10 transition-colors bg-primary/5 py-2.5 rounded-lg"
              >
                Choisir une image
              </button>
            </div>
          </div>
          
        </div>

      </form>
    </div>
  );
}
