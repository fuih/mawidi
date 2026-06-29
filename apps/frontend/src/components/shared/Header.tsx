import { Link } from "react-router-dom";
import { Menu, X, LayoutDashboard, LogOut, ArrowLeft } from "lucide-react";
import { useAuthStore } from "../../lib/authStore";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header() {
  const { t } = useTranslation();
  const { isAuthenticated, userType, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100">
      <div className="container flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
        
        {/* Back Arrow & Logo */}
        <div className="flex items-center gap-4 shrink-0">
          <Link to="/" className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </Link>
          <Link to="/" className="flex items-center">
            <img 
              src="/images/logosvg.svg" 
              alt="Mawidi Logo" 
              className="h-14 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Desktop Navigation (Removed) */}
        <nav className="hidden lg:flex items-center gap-8"></nav>

        {/* Right Actions */}
        <div className="hidden lg:flex items-center gap-3">
          <LanguageSwitcher />
          {isAuthenticated ? (
            <>
              {userType === "doctor" && (
                <Link 
                  to="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary font-medium rounded-lg text-sm hover:bg-primary/20 transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Tableau de bord
                </Link>
              )}
              {userType === "patient" && (
                <Link 
                  to="/patient/dashboard"
                  className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary font-medium rounded-lg text-sm hover:bg-primary/20 transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Mon Espace
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 font-medium rounded-lg text-sm hover:bg-gray-100 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login"
                className="px-5 py-2.5 text-sm font-semibold text-[#112142] border border-[#112142]/15 rounded-xl hover:border-[#039D77]/40 hover:text-[#039D77] hover:bg-[#039D77]/5 transition-all duration-200"
              >
                {t('header.login')}
              </Link>
              <Link 
                to="/register/doctor"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[#039D77] rounded-xl hover:bg-[#027a5c] transition-all duration-200 hover:scale-105 shadow-sm"
              >
                {t('header.forDoctors')}
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="lg:hidden p-2 text-gray-600"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-4 shadow-lg pb-6">
          <nav className="flex flex-col gap-4">
            {/* Links Removed */}
          </nav>
          
          <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
            <div className="flex justify-center mb-2">
              <LanguageSwitcher />
            </div>
            {isAuthenticated ? (
              <>
                {userType === "doctor" && (
                  <Link 
                    to="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary font-medium rounded-lg text-sm hover:bg-primary/20 transition-colors w-full"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Tableau de bord
                  </Link>
                )}
                {userType === "patient" && (
                  <Link 
                    to="/patient/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary font-medium rounded-lg text-sm hover:bg-primary/20 transition-colors w-full"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Mon Espace
                  </Link>
                )}
                <button
                  onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 font-medium rounded-lg text-sm hover:bg-gray-100 transition-colors w-full text-left"
                >
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-center px-5 py-3 text-sm font-semibold text-[#112142] border border-gray-200 rounded-xl mb-3"
                >
                  {t('header.login')}
                </Link>
                <Link 
                  to="/register/doctor"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-center px-5 py-3 text-sm font-semibold text-white bg-[#039D77] rounded-xl"
                >
                  {t('header.forDoctors')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
