import { useState, useEffect } from "react";
import { motion, useScroll } from "framer-motion";
import { Menu, X, Heart } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
          ? "bg-white/80 backdrop-blur-2xl shadow-glass border-b border-white/50"
          : "bg-transparent"
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 group transition-transform hover:scale-105">
            <img 
              src="/images/logosvg.svg" 
              alt="Mawidi Logo" 
              className="h-14 w-auto"
            />
          </a>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="/login"
              className="px-5 py-2.5 text-sm font-semibold text-[#112142] border border-[#112142]/15 rounded-xl hover:border-[#039D77]/40 hover:text-[#039D77] hover:bg-[#039D77]/5 transition-all duration-200"
            >
              Connexion
            </a>
            <a
              href="/register/doctor"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#039D77] rounded-xl hover:bg-[#027a5c] transition-all duration-200 hover:scale-105 hover:shadow-emerald-lg"
            >
              Vous êtes médecin ?
            </a>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-[#112142]"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden bg-white/95 backdrop-blur-2xl border-t border-gray-100 px-6 py-6 space-y-4"
        >
          <div className="pt-4 space-y-3 border-t border-gray-100">
            <a
              href="/login"
              className="block w-full text-center px-5 py-3 text-sm font-semibold text-[#112142] border border-gray-200 rounded-xl"
            >
              Connexion
            </a>
            <a
              href="/register/doctor"
              className="block w-full text-center px-5 py-3 text-sm font-semibold text-white bg-[#039D77] rounded-xl"
              onClick={() => setMenuOpen(false)}
            >
              Vous êtes médecin ?
            </a>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}