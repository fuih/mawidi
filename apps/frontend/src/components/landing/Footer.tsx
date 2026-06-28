
import { Heart, Twitter, Facebook, Instagram, Linkedin, Mail, Phone } from "lucide-react";

const footerLinks = {
  Patients: [
    { label: "Trouver un médecin", href: "#hero" },
    { label: "Comment ça marche ?", href: "#how-it-works" },
    { label: "Nos spécialités", href: "#" },
    { label: "Télécharger l'appli", href: "#" },
  ],
  Médecins: [
    { label: "Créer mon cabinet", href: "#doctors" },
    { label: "Fonctionnalités", href: "#doctors" },
    { label: "Tarifs", href: "#" },
    { label: "Démo gratuite", href: "#" },
  ],
  Légal: [
    { label: "Conditions d'utilisation", href: "#" },
    { label: "Politique de confidentialité", href: "#" },
    { label: "Mentions légales", href: "#" },
    { label: "FAQ", href: "#" },
  ],
};

const socials = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
];

export default function Footer() {
  return (
    <footer className="bg-[#112142] border-t border-white/5">


      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="col-span-2">
            <a href="/" className="flex items-center gap-2.5 mb-5 transition-transform hover:scale-105 inline-block">
              <img 
                src="/images/logosvg.svg" 
                alt="Mawidi Logo" 
                className="h-14 w-auto filter brightness-0 invert opacity-90"
              />
            </a>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs mb-6">
              La première plateforme de prise de rendez-vous médicaux en ligne pour l'Algérie. Fiable, sécurisée et disponible 24h/24.
            </p>

            {/* Contact info */}
            <div className="space-y-2 mb-6">
              <a href="mailto:contact@mawidi.dz" className="flex items-center gap-2 text-white/40 hover:text-[#039D77] transition-colors text-sm">
                <Mail className="w-4 h-4" />
                contact@mawidi.dz
              </a>
              <a href="tel:+213XXXXXXX" className="flex items-center gap-2 text-white/40 hover:text-[#039D77] transition-colors text-sm">
                <Phone className="w-4 h-4" />
                +213 XX XX XX XX
              </a>
            </div>

            {/* Socials */}
            <div className="flex items-center gap-3">
              {socials.map(({ icon: SocialIcon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-xl bg-white/6 hover:bg-[#039D77]/20 border border-white/8 hover:border-[#039D77]/30 flex items-center justify-center text-white/40 hover:text-[#039D77] transition-all duration-200"
                >
                  <SocialIcon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-white text-sm font-bold mb-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-white/40 hover:text-[#039D77] text-sm transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/25 text-sm">
            © {new Date().getFullYear()} Mawidi. Tous droits réservés. Fait avec{" "}
            <Heart className="inline w-3 h-3 text-[#039D77] fill-[#039D77]" /> en Algérie.
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-white/25">
              <span className="w-2 h-2 rounded-full bg-[#039D77] animate-pulse" />
              Tous les systèmes opérationnels
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}