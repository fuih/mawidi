import { Link, useLocation } from "react-router-dom";
import { Menu, X, LayoutDashboard, LogOut } from "lucide-react";
import { useAuthStore } from "../../lib/authStore";
import { useState } from "react";

export function Header() {
  const location = useLocation();
  const { isAuthenticated, userType, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Accueil", href: "/" },
    { name: "Trouver un médecin", href: "/search" },
  ];

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100">
      <div className="container flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
        
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img 
            src="/images/logosvg.svg" 
            alt="Mawidi Logo" 
            className="h-14 w-auto object-contain"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.name}
              to={link.href} 
              className={`text-sm font-semibold transition-colors hover:text-primary ${
                location.pathname === link.href ? 'text-primary' : 'text-gray-600'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="hidden lg:flex items-center gap-3">
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
                to="/register/doctor"
                className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
              >
                Vous êtes médecin ?
              </Link>
              <Link 
                to="/login"
                className="px-6 py-2.5 bg-primary text-white font-semibold rounded-full text-sm hover:bg-primary/90 transition-colors"
              >
                Connexion
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
            {navLinks.map((link) => (
              <Link 
                key={link.name}
                to={link.href} 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-sm font-semibold transition-colors hover:text-primary ${
                  location.pathname === link.href ? 'text-primary' : 'text-gray-600'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
          
          <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
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
                  to="/register/doctor"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-sm font-semibold text-foreground hover:text-primary transition-colors text-center w-full block py-2"
                >
                  Vous êtes médecin ?
                </Link>
                <Link 
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-6 py-2.5 bg-primary text-white font-semibold rounded-full text-sm hover:bg-primary/90 transition-colors text-center w-full block"
                >
                  Connexion
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
