import { useState, useEffect } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import api from "../../lib/api";

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  specialty: string;
  city: string;
  is_verified: boolean;
}

export function AdminDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDoctors = () => {
    setLoading(true);
    api.get("/admin/doctors")
      .then((res) => setDoctors(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const toggleVerify = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/admin/doctors/${id}/verify`, { is_verified: !currentStatus });
      fetchDoctors();
    } catch (err) {
      alert("Erreur lors de la mise à jour");
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spécialité</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ville</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {doctors.map((doc) => (
              <tr key={doc.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">Dr. {doc.first_name} {doc.last_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{doc.specialty}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{doc.city}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {doc.is_verified ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" /> Vérifié
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <XCircle className="w-3 h-3 mr-1" /> En attente
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => toggleVerify(doc.id, doc.is_verified)}
                    className={`${doc.is_verified ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}`}
                  >
                    {doc.is_verified ? "Révoquer" : "Valider"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
