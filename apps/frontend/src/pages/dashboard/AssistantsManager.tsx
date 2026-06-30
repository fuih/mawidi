import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Users, Eye, EyeOff } from "lucide-react";
import api from "../../lib/api";
import { Skeleton } from "../../components/ui/Skeleton";

interface Assistant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  is_active: boolean;
}

export function AssistantsManager() {
  const { t } = useTranslation();
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const fetchAssistants = async () => {
    try {
      const res = await api.get("/assistants");
      setAssistants(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssistants();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/assistants", formData);
      setShowForm(false);
      setFormData({ first_name: "", last_name: "", email: "", phone: "", password: "" });
      fetchAssistants();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail[0].msg);
      } else {
        setError(detail || t('assistantsManager.addError'));
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('assistantsManager.confirmDelete'))) return;
    try {
      await api.delete(`/assistants/${id}`);
      fetchAssistants();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b">
              <tr>
                <th className="px-6 py-4"><Skeleton className="h-4 w-20" /></th>
                <th className="px-6 py-4"><Skeleton className="h-4 w-24" /></th>
                <th className="px-6 py-4"><Skeleton className="h-4 w-16" /></th>
                <th className="px-6 py-4 text-right"><Skeleton className="h-4 w-16 ml-auto" /></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-40 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                  <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-8 rounded-lg ml-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="text-start">
          <h1 className="text-2xl font-bold text-gray-900">{t('assistantsManager.title')}</h1>
          <p className="text-gray-500 mt-1">{t('assistantsManager.subtitle')}</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t('assistantsManager.add')}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-8 text-start">
          <h2 className="text-lg font-bold mb-4">{t('assistantsManager.newAssistant')}</h2>
          {error && <div className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded">{error}</div>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('assistantsManager.firstName')}</label>
              <input required type="text" className="w-full border rounded-lg px-3 py-2" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('assistantsManager.lastName')}</label>
              <input required type="text" className="w-full border rounded-lg px-3 py-2" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('assistantsManager.email')}</label>
              <input required type="email" className="w-full border rounded-lg px-3 py-2 text-start" dir="ltr" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('assistantsManager.phone')}</label>
              <input required type="tel" className="w-full border rounded-lg px-3 py-2 text-start" dir="ltr" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">{t('assistantsManager.tempPassword')}</label>
              <div className="relative">
                <input required type={showPassword ? "text" : "password"} minLength={8} className="w-full border rounded-lg px-3 py-2 ltr:pr-10 rtl:pl-10 text-start" dir="ltr" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-4">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg font-medium hover:bg-gray-50">{t('assistantsManager.cancel')}</button>
              <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90">{t('assistantsManager.save')}</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {assistants.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p>{t('assistantsManager.noAssistants')}</p>
          </div>
        ) : (
          <table className="w-full text-start text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b">
              <tr>
                <th className="px-6 py-4 font-medium">{t('assistantsManager.lastName')}</th>
                <th className="px-6 py-4 font-medium">{t('assistantsManager.contact')}</th>
                <th className="px-6 py-4 font-medium">{t('assistantsManager.status')}</th>
                <th className="px-6 py-4 font-medium text-end">{t('assistantsManager.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {assistants.map((ast) => (
                <tr key={ast.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{ast.first_name} {ast.last_name}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <div>{ast.email}</div>
                    <div className="text-xs">{ast.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      {t('assistantsManager.active')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-end">
                    <button 
                      onClick={() => handleDelete(ast.id)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title={t('assistantsManager.delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
