import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t pt-16 pb-8">
      <div className="container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {/* Brand */}
        <div className="flex flex-col gap-4">
          <Link to="/" className="flex items-center">
            <img 
              src="/images/logosvg.svg" 
              alt="Mawidi Logo" 
              className="h-10 w-auto object-contain"
            />
          </Link>
          <p className="text-sm text-gray-500 max-w-xs">
            La plateforme de prise de rendez-vous médicaux en Algérie. 
            Trouvez le bon spécialiste et réservez en quelques clics.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-3">
          <h4 className="font-semibold text-gray-900">Liens utiles</h4>
          <Link to="/search" className="text-sm text-gray-500 hover:text-primary transition-colors">Trouver un médecin</Link>
          <a href="#specialties" className="text-sm text-gray-500 hover:text-primary transition-colors">Spécialités</a>
          <a href="#how-it-works" className="text-sm text-gray-500 hover:text-primary transition-colors">Comment ça marche</a>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-3">
          <h4 className="font-semibold text-gray-900">Informations</h4>
          <a href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">Centre d'aide</a>
          <a href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">Conditions d'utilisation</a>
          <a href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">Politique de confidentialité</a>
          <Link to="/login" className="text-sm text-gray-500 hover:text-primary transition-colors">Espace professionnels</Link>
        </div>

        {/* Contact */}
        <div className="flex flex-col gap-3">
          <h4 className="font-semibold text-gray-900">Nous contacter</h4>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Phone className="h-4 w-4 text-primary" />
            <span>+213 555 12 34 56</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Mail className="h-4 w-4 text-primary" />
            <span>contact@mawidi.dz</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin className="h-4 w-4 text-primary" />
            <span>Alger, Algérie</span>
          </div>
        </div>
      </div>

      <div className="container border-t pt-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} موعدي Mawidi. Tous droits réservés.
      </div>
    </footer>
  );
}
