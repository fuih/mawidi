import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import api from "../lib/api";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Aucun jeton de vérification fourni.");
      return;
    }

    if (hasAttempted.current) return;
    hasAttempted.current = true;

    api.post('/auth/verify-email', { token })
      .then(() => {
        setStatus("success");
      })
      .catch((err) => {
        setStatus("error");
        setErrorMessage(err.response?.data?.detail || "Le lien de vérification est invalide ou a expiré.");
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
          Vérification de l'e-mail
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center py-6">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <p className="text-gray-600">Vérification en cours...</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center justify-center py-6">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">E-mail vérifié !</h3>
              <p className="text-gray-600 mb-6">
                Votre adresse e-mail a été vérifiée avec succès. Votre profil apparaîtra désormais dans les résultats de recherche.
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Aller au tableau de bord
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center justify-center py-6">
              <XCircle className="h-16 w-16 text-red-500 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Échec de la vérification</h3>
              <p className="text-gray-600 mb-6">{errorMessage}</p>
              <button
                onClick={() => navigate("/login")}
                className="w-full flex justify-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Retour à la connexion
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
