import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import api from "../lib/api";
import { useAuthStore } from "../lib/authStore";

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [tab, setTab] = useState<"doctor" | "patient">("doctor");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = tab === "doctor" ? "/auth/login" : "/auth/patient/login";
      // OAuth2 form expects form-encoded data
      const params = new URLSearchParams();
      params.append("username", tab === "doctor" ? email : phone);
      params.append("password", password);

      await api.post(endpoint, params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      await login();

      if (tab === "doctor") {
        navigate("/dashboard");
      } else {
        navigate("/patient/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="bg-white p-8 rounded-xl shadow-sm border max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Connexion</h1>

        {/* Tabs */}
        <div className="flex mb-6 border rounded-lg overflow-hidden">
          <button
            onClick={() => setTab("doctor")}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              tab === "doctor" ? "bg-primary text-white" : "bg-gray-50 text-gray-600"
            }`}
          >
            Médecin / Secrétaire
          </button>
          <button
            onClick={() => setTab("patient")}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              tab === "patient" ? "bg-primary text-white" : "bg-gray-50 text-gray-600"
            }`}
          >
            Patient
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === "doctor" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                placeholder="doctor@example.com"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                placeholder="0555123456"
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
              {tab === "doctor" && (
                <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                  Mot de passe oublié ?
                </Link>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Pas encore de compte ?{" "}
          <Link to={tab === "doctor" ? "/register/doctor" : "/register/patient"} className="text-primary font-medium hover:underline">
            S'inscrire
          </Link>
        </div>
      </div>
    </div>
  );
}
