import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, LogOut, ShieldCheck } from "lucide-react";
import { useAuthStore } from "../../lib/authStore";

export function AdminLayout() {
  const { userType, isAuthenticated, logout } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || userType !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }

  const navigation = [
    { name: "Tableau de bord", href: "/admin", icon: LayoutDashboard },
    { name: "Médecins", href: "/admin/doctors", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="h-16 flex items-center px-6 border-b">
          <ShieldCheck className="h-8 w-8 text-blue-600 mr-2" />
          <span className="text-xl font-bold text-gray-900">Admin</span>
        </div>
        
        <div className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 ${isActive ? "text-blue-700" : "text-gray-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t">
          <button
            onClick={() => {
              logout();
            }}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Déconnexion
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white shadow-sm flex items-center px-8">
          <h1 className="text-xl font-semibold text-gray-800">
            {navigation.find((n) => n.href === location.pathname)?.name || "Administration"}
          </h1>
        </header>
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
