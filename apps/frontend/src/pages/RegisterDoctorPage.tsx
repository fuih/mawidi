import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Clock, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../lib/api";

export function RegisterDoctorPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
    specialty: "",
    city: "",
    gender: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);

  useEffect(() => {
    api.get("/search/cities").then((r) => setCities(r.data)).catch(() => {});
    api.get("/search/specialties").then((r) => setSpecialties(r.data)).catch(() => {});
  }, []);

  const set = (field: string, value: string) => setForm({ ...form, [field]: value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/register", form);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || t('auth.registerError'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border max-w-md w-full text-center">
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
            <Clock className="h-9 w-9 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('auth.registerSuccessTitle')}</h2>
          <p className="text-gray-600 mb-6">
            {t('auth.registerSuccessDesc1')}
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-start">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">{t('auth.registerSuccessStepsTitle')}</p>
                <ol className="list-decimal list-inside space-y-1 text-amber-700">
                  <li>{t('auth.registerSuccessStep1')}</li>
                  <li>{t('auth.registerSuccessStep2')}</li>
                  <li>{t('auth.registerSuccessStep3')}</li>
                </ol>
              </div>
            </div>
          </div>
          <Link
            to="/"
            className="inline-block w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors text-center"
          >
            {t('auth.backToHome')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="bg-white p-8 rounded-xl shadow-sm border max-w-lg w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">{t('auth.registerDoctorTitle')}</h1>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-start">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.firstName')}</label>
              <input
                type="text" required value={form.first_name}
                onChange={(e) => set("first_name", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none text-start"
              />
            </div>
            <div className="text-start">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.lastName')}</label>
              <input
                type="text" required value={form.last_name}
                onChange={(e) => set("last_name", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none text-start"
              />
            </div>
          </div>

          <div className="text-start">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.emailLabel')}</label>
            <input
              type="email" required value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none text-start ltr:dir-ltr text-gray-900"
            />
          </div>

          <div className="text-start">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.passwordMin')}</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"} required minLength={8} value={form.password}
                onChange={(e) => set("password", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none pe-10 text-start ltr:dir-ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="text-start">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.phoneLabel')}</label>
            <input
              type="tel" required value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none text-start ltr:dir-ltr"
              placeholder="0555123456"
            />
          </div>

          <div className="text-start">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.gender')}</label>
            <select
              required value={form.gender}
              onChange={(e) => set("gender", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none text-start"
            >
              <option value="">{t('auth.choose')}</option>
              <option value="male">{t('auth.male')}</option>
              <option value="female">{t('auth.female')}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-start">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.specialty')}</label>
              <select
                required value={form.specialty}
                onChange={(e) => set("specialty", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none text-start"
              >
                <option value="">{t('auth.choose')}</option>
                {specialties.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="text-start">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.city')}</label>
              <select
                required value={form.city}
                onChange={(e) => set("city", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none text-start"
              >
                <option value="">{t('auth.choose')}</option>
                {cities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {loading ? t('auth.registerLoading') : t('auth.registerButton')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          {t('auth.alreadyRegistered')}{" "}
          <Link to="/login" className="text-primary font-medium hover:underline mx-1">{t('auth.loginButton')}</Link>
        </div>
      </div>
    </div>
  );
}
