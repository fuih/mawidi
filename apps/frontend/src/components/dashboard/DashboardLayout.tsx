import { Link, Outlet, useLocation, useNavigate, Navigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  ListTodo,
  Clock, 
  Settings, 
  LogOut,
  Menu,
  Bell,
  Users,
  TrendingUp,
  Globe,
  CreditCard
} from "lucide-react";
import { useState, useEffect } from "react";
import { NotificationBell } from "./NotificationBell";
import { useAuthStore } from "../../lib/authStore";
import api, { getImageUrl } from "../../lib/api";

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, userType, isAuthenticated, isInitializing } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [resendStatus, setResendStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    api.get("/dashboard/profile")
      .then(res => setProfile(res.data))
      .catch(err => console.error("Failed to load profile", err));
  }, []);

  const handleResend = async () => {
    if (!profile?.email) return;
    setResendStatus("loading");
    try {
      await api.post(`/auth/verify-email/resend?email=${encodeURIComponent(profile.email)}`);
      setResendStatus("success");
    } catch {
      setResendStatus("error");
    }
  };

  const navigation = [
    { name: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
    { name: "Rendez-vous", href: "/dashboard/appointments", icon: ListTodo },
    { name: "Disponibilités", href: "/dashboard/schedule", icon: Clock },
    { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  ];

  if (userType === "doctor") {
    navigation.push(
      { name: "Statistiques", href: "/dashboard/stats", icon: TrendingUp },
      { name: "Assistants", href: "/dashboard/assistants", icon: Users },
      { name: "Abonnement", href: "/dashboard/billing", icon: CreditCard },
      { name: "Paramètres", href: "/dashboard/settings", icon: Settings }
    );
  }

  if (isInitializing) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Chargement...</div>;
  }

  if (!isAuthenticated || !["doctor", "assistant"].includes(userType as string)) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r shadow-sm transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex h-16 items-center px-6 border-b justify-center">
          <Link to="/" className="flex items-center">
            <img 
              src="/images/logosvg.svg" 
              alt="Mawidi Logo" 
              className="h-10 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Profile Card at Top */}
        <div className="p-6 border-b flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold mb-3 border-2 border-white shadow-sm ring-1 ring-gray-100 overflow-hidden">
            {profile?.profile_photo_url ? (
              <img src={getImageUrl(profile.profile_photo_url)} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <>{[profile?.first_name?.[0], profile?.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?'}</>
            )}
          </div>
          <h3 className="font-semibold text-gray-900">Dr. {profile?.first_name} {profile?.last_name}</h3>
          <p className="text-xs text-gray-500 mb-4">{profile?.speciality?.name || "Médecin"}</p>
          <div className="flex w-full gap-2">
            <Link to="/dashboard/settings" className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium rounded-lg border transition-colors flex items-center justify-center gap-1" title="Paramètres">
              <Settings className="h-3.5 w-3.5" />
              Profil
            </Link>
            {profile?.id && (
              <a 
                href={`/${profile.slug || profile.id}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium rounded-lg border border-primary/20 transition-colors flex items-center justify-center gap-1"
                title="Page publique"
              >
                <Globe className="h-3.5 w-3.5" />
                Public
              </a>
            )}
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}
                `}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-gray-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t bg-white">
          <div className="flex items-center justify-between mb-4 px-2">
            <button className="flex items-center gap-2 text-xs font-medium text-white bg-primary px-3 py-1.5 rounded-md">
              FR
            </button>
            <button className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-md">
              العربية
            </button>
          </div>
          <button 
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Déconnexion
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-4 sm:px-6 lg:px-8">
          <button
            className="lg:hidden text-gray-500 hover:text-gray-900"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex flex-1 justify-end items-center gap-4">
            <NotificationBell />
            <div className="flex items-center gap-2 border-l pl-4 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors">
              <Globe className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">FR</span>
            </div>
          </div>
        </header>

        {/* Main Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 flex flex-col">
          {profile && profile.is_verified === false && userType === "doctor" && (
            <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
              <div className="text-sm text-yellow-800">
                <span className="font-semibold">Action requise :</span> Veuillez vérifier votre adresse e-mail pour que votre profil apparaisse dans la recherche des patients.
              </div>
              <button 
                onClick={handleResend}
                disabled={resendStatus === "loading" || resendStatus === "success"}
                className="whitespace-nowrap px-3 py-1.5 text-xs font-medium bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-md transition-colors disabled:opacity-50"
              >
                {resendStatus === "loading" ? "Envoi..." : resendStatus === "success" ? "E-mail envoyé !" : "Renvoyer l'e-mail"}
              </button>
            </div>
          )}
          {profile && profile.subscription_status === "past_due" && userType === "doctor" && (
            <div className="bg-red-50 border-b border-red-200 px-4 py-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
              <div className="text-sm text-red-800">
                <span className="font-semibold">Abonnement expiré :</span> Votre profil n'est plus visible pour les patients. Veuillez renouveler votre abonnement.
              </div>
              <Link 
                to="/dashboard/billing"
                className="whitespace-nowrap px-3 py-1.5 text-xs font-medium bg-red-100 hover:bg-red-200 text-red-800 rounded-md transition-colors"
              >
                Renouveler
              </Link>
            </div>
          )}
          <div className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
      
    </div>
  );
}
