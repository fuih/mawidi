import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import api from "../lib/api";
import { useAuthStore } from "../lib/authStore";

export function RegisterPatientPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const set = (field: string, value: string) => setForm({ ...form, [field]: value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        ...form,
        email: form.email || null,
        password: form.password || null,
      };
      await api.post("/auth/patient/register", payload);
      await login();
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="bg-white p-8 rounded-xl shadow-sm border max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Inscription Patient</h1>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input
                type="text" required value={form.first_name}
                onChange={(e) => set("first_name", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                type="text" required value={form.last_name}
                onChange={(e) => set("last_name", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
            <input
              type="tel" required value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              placeholder="0555123456"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email (optionnel)</label>
            <input
              type="email" value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe (optionnel, 8 car. min)</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"} minLength={8} value={form.password}
                onChange={(e) => set("password", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {loading ? "Inscription..." : "S'inscrire"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Déjà inscrit ?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">Se connecter</Link>
        </div>
      </div>
    </div>
  );
}
