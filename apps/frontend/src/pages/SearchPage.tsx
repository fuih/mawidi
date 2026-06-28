import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, MapPin, User, Stethoscope, ChevronDown, BadgeCheck, RotateCcw } from "lucide-react";
import api, { getImageUrl } from "../lib/api";
import { Skeleton } from "../components/ui/Skeleton";
import { ALGERIAN_WILAYAS } from "../constants";

interface DoctorResult {
  id: string;
  first_name: string;
  last_name: string;
  specialty: string;
  city: string;
  bio: string | null;
  profile_photo_url: string | null;
  consultation_fee: number | null;
  slug?: string;
}

export function SearchPage() {
  // We removed specialty from the sidebar as per user request, but we still need it for the top banner search.
  // Wait, the mockup top banner has "Spécialité, médecin..." as ONE input box!
  // And "Ville ou Wilaya" as the second input.
  // We will keep `name` as the main query input which searches by name or specialty if backend supports it.
  // Actually, our backend supports `name` (searches first/last name), `specialty` (exact match), and `city`.
  // To keep it simple, we'll map the "Spécialité, médecin..." input to `name` state, and users can type anything.
  // But wait, the backend `name` only searches first/last name.
  // Let's just keep the state variables.
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("name") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [gender, setGender] = useState("");
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  
  const [doctors, setDoctors] = useState<DoctorResult[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/search/cities").then((r) => setCities(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      setError("");
      try {
        const params: Record<string, string> = {};
        if (city) params.city = city;
        if (searchQuery) params.name = searchQuery; // Fallback: searching name
        if (gender) params.gender = gender;
        
        const res = await api.get("/search/doctors", { params });
        if (Array.isArray(res.data)) {
          setDoctors(res.data);
        } else {
          setDoctors([]);
          setError("Le serveur n'a pas renvoyé une liste valide. Vérifiez l'URL de l'API (VITE_API_URL).");
        }
      } catch (err: any) {
        setError("Erreur lors de la recherche");
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchDoctors, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, city, gender]);

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Search Header Banner */}
      <div className="bg-[#f1f8f7] py-12">
        <div className="container max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          
          <div>
            <h1 className="text-3xl font-bold mb-2 text-[#112142] text-center lg:text-left">
              Trouvez le bon médecin
            </h1>
            <p className="text-gray-600 text-center lg:text-left">
              Recherchez par spécialité, ville ou nom de médecin
            </p>
          </div>

          <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-sm border border-gray-100 w-full lg:w-auto lg:min-w-[600px] p-2 gap-2">
            
            <div className="flex-1 flex items-center gap-3 px-4 py-2 border-r border-gray-100 last:border-none">
              <Stethoscope className="h-5 w-5 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Spécialité, médecin..."
                className="w-full bg-transparent outline-none text-gray-900"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex-1 relative">
              <div 
                className="flex items-center gap-3 px-4 py-2 cursor-pointer h-full"
                onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
              >
                <MapPin className="h-5 w-5 text-gray-400 shrink-0" />
                <div className={`w-full truncate ${city ? 'text-gray-900' : 'text-gray-500'}`}>
                  {city ? city : "Ville ou Wilaya"}
                </div>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isCityDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {isCityDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsCityDropdownOpen(false)}
                  ></div>
                  <div className="absolute top-full left-0 mt-2 w-full sm:w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-20 max-h-80 overflow-y-auto">
                    <div 
                      className={`px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-sm transition-colors ${!city ? 'font-semibold text-[#112142]' : 'text-gray-700'}`}
                      onClick={() => { setCity(""); setIsCityDropdownOpen(false); }}
                    >
                      Toutes les wilayas
                    </div>
                    {(cities.length > 0 ? cities : ALGERIAN_WILAYAS).map((c) => (
                      <div 
                        key={c}
                        className={`px-4 py-2.5 hover:bg-[#f1f8f7] hover:text-[#039D77] cursor-pointer text-sm transition-colors ${city === c ? 'font-semibold text-[#039D77] bg-[#f1f8f7]' : 'text-gray-700'}`}
                        onClick={() => { setCity(c); setIsCityDropdownOpen(false); }}
                      >
                        {c}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button className="bg-[#039D77] text-white font-medium px-8 py-3 rounded-xl hover:bg-[#039D77]/90 transition-colors flex items-center justify-center gap-2">
               <Search className="w-5 h-5" />
               Rechercher
            </button>
          </div>
          
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h2 className="font-bold text-[#112142] flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                Filtres
              </h2>
              <button 
                onClick={() => setGender("")}
                className="text-sm font-medium text-[#039D77] hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Réinitialiser
              </button>
            </div>

            {/* Gender Filter */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Genre du médecin</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="gender" value="" checked={gender === ""} onChange={(e) => setGender(e.target.value)} className="w-4 h-4 text-[#039D77] focus:ring-[#039D77] border-gray-300" />
                  <span className="text-sm text-gray-700">Tous</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="gender" value="homme" checked={gender === "homme"} onChange={(e) => setGender(e.target.value)} className="w-4 h-4 text-[#039D77] focus:ring-[#039D77] border-gray-300" />
                  <span className="text-sm text-gray-700">Homme</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="gender" value="femme" checked={gender === "femme"} onChange={(e) => setGender(e.target.value)} className="w-4 h-4 text-[#039D77] focus:ring-[#039D77] border-gray-300" />
                  <span className="text-sm text-gray-700">Femme</span>
                </label>
              </div>
            </div>
          </div>

          {/* Results Area */}
          <div className="lg:col-span-3">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <h2 className="text-lg font-bold text-[#112142]">
                {loading ? "Recherche en cours..." : `${doctors.length} médecins trouvés`}
              </h2>
            </div>

            <div className="space-y-4">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-6">
                    <div className="relative shrink-0 mx-auto sm:mx-0">
                      <Skeleton className="h-24 w-24 rounded-full border-4 border-gray-50" />
                    </div>
                    <div className="flex-1 flex flex-col sm:flex-row justify-between items-center sm:items-start text-center sm:text-left gap-4">
                      <div className="w-full">
                        <Skeleton className="h-7 w-3/4 max-w-[250px] mb-2 mx-auto sm:mx-0" />
                        <Skeleton className="h-5 w-1/2 max-w-[150px] mb-3 mx-auto sm:mx-0" />
                        <Skeleton className="h-4 w-1/3 max-w-[120px] mb-4 mx-auto sm:mx-0" />
                        <Skeleton className="h-4 w-full max-w-[400px] mb-1.5" />
                        <Skeleton className="h-4 w-5/6 max-w-[350px]" />
                      </div>
                      <div className="flex flex-col items-center sm:items-end justify-center h-full sm:pt-4 w-full sm:w-auto">
                        <Skeleton className="h-10 w-32 rounded-xl" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                doctors.map((doctor) => (
                  <div key={doctor.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-6 hover:shadow-md transition-shadow">
                    {/* Photo */}
                    <div className="relative shrink-0 mx-auto sm:mx-0">
                      <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-gray-50 bg-gray-100 flex items-center justify-center">
                        {doctor.profile_photo_url ? (
                          <img src={getImageUrl(doctor.profile_photo_url)} alt={doctor.last_name} className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-10 w-10 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 flex flex-col sm:flex-row justify-between items-center sm:items-start text-center sm:text-left gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-[#112142] flex items-center justify-center sm:justify-start gap-2">
                          Dr. {doctor.first_name} {doctor.last_name}
                          <BadgeCheck className="w-5 h-5 text-[#039D77]" />
                        </h3>
                        <p className="text-[#039D77] font-medium text-sm mt-1">{doctor.specialty}</p>
                        
                        <div className="flex items-center justify-center sm:justify-start gap-1 text-sm text-gray-500 mt-2">
                          <MapPin className="h-4 w-4 shrink-0" />
                          <span>{doctor.city}</span>
                        </div>
                        
                        {doctor.bio && (
                          <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                            {doctor.bio}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-center sm:items-end justify-center h-full sm:pt-4">
                         <Link
                          to={`/${doctor.slug || doctor.id}`}
                          className="bg-[#039D77] text-white font-medium px-8 py-2.5 rounded-xl hover:bg-[#039D77]/90 transition-colors"
                         >
                          Voir le profil
                         </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {!loading && doctors.length === 0 && (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-[#112142]">Aucun médecin trouvé</h3>
                  <p className="text-gray-500 mt-1">Essayez de modifier vos critères de recherche.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
