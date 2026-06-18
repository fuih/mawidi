import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  ShieldCheck,
  CalendarDays,
  CheckCircle2,
  UserCheck,
  MapPin as MapPinIcon,
  Bell,
  Smile,
  Shield,
  Smartphone,
  MousePointerClick,
  FileText,
  Clock,
  HeadphonesIcon,
  CreditCard,
  Info
} from "lucide-react";

export function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">

      {/* 1. HERO SECTION */}
      <section className="relative w-full bg-white overflow-hidden pt-16 pb-20 min-h-[700px] flex flex-col justify-center">

        {/* Hero Image (Absolute to screen right edge) */}
        <div className="absolute top-1/2 -translate-y-1/2 -right-0 w-[60vw] max-w-[1000px] h-[750px] hidden lg:flex items-center justify-center z-10">
          <img
            src="/images/Vector%203.svg"
            alt="Mawidi Hero"
            className="w-full h-full object-contain scale-[1.15] translate-x-8"
          />
        </div>

        <div className="container max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

            {/* Hero Left: Text & Search */}
            <div className="max-w-2xl pt-6">
              <h1 className="text-5xl md:text-6xl lg:text-[64px] font-bold text-[#1e293b] leading-[1.15] mb-6 tracking-tight">
                Trouvez le bon <br />
                médecin, près de <br />
                chez vous
              </h1>
              <p className="text-lg text-gray-600 mb-10 max-w-lg">
                Prenez rendez-vous en quelques clics avec des médecins qualifiés partout en Algérie.
              </p>

              {/* Floating Search Bar */}
              <div className="bg-white p-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex flex-col sm:flex-row gap-2 w-full max-w-[700px] mb-8 border border-gray-100">
                <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-white rounded-xl">
                  <Search className="h-5 w-5 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Spécialité, médecin, clinique..."
                    className="w-full bg-transparent outline-none text-gray-900 placeholder:text-gray-400 text-sm md:text-base"
                  />
                </div>
                <div className="hidden sm:block w-px h-10 bg-gray-100 self-center"></div>
                <div className="flex-[0.8] flex items-center gap-3 px-4 py-3 bg-white rounded-xl">
                  <MapPin className="h-5 w-5 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Ville ou Wilaya"
                    className="w-full bg-transparent outline-none text-gray-900 placeholder:text-gray-400 text-sm md:text-base"
                  />
                </div>
                <button className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm md:text-base">
                  <Search className="h-5 w-5" />
                  Rechercher
                </button>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1 flex items-center gap-4 bg-white px-5 py-4 rounded-2xl shadow-sm border border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-[#f1f8f7] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1e293b]">Rendez-vous rapide et confirmé</p>
                    <p className="text-xs text-gray-500 mt-0.5">Sans appel téléphonique</p>
                  </div>
                </div>
                <div className="flex-1 flex items-center gap-4 bg-white px-5 py-4 rounded-2xl shadow-sm border border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-[#f1f8f7] flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1e293b]">Vos données sont sécurisées</p>
                    <p className="text-xs text-gray-500 mt-0.5">Confidentialité garantie</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Right: Just the Floating Card (Image moved out of container) */}
            <div className="relative hidden lg:block h-[600px]">
              {/* Floating Card */}
              <div className="absolute bottom-6 right-0 xl:-right-8 bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 flex items-center gap-6 max-w-md z-40">
                <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center">
                  <img src="/images/algeria-1.png" alt="Algérie" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-foreground mb-2">Partout en Algérie</h4>
                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                    Trouvez un médecin dans votre ville en quelques clics
                  </p>
                  <a href="#" className="text-primary font-bold text-sm flex items-center gap-1 hover:underline">
                    Voir toutes les wilayas &rarr;
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. FEATURES ROW */}
      <section className="py-10 bg-white border-b border-gray-50">
        <div className="container max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 lg:divide-x lg:divide-gray-200">
            <div className="flex flex-col items-center text-center lg:px-6">
              <div className="w-16 h-16 rounded-full bg-[#f1f8f7] flex items-center justify-center mb-4 text-primary">
                <CalendarDays className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Réservez facilement</h3>
              <p className="text-sm text-gray-500 leading-relaxed max-w-[200px]">
                Choisissez la date et l'heure qui vous conviennent.
              </p>
            </div>
            <div className="flex flex-col items-center text-center lg:px-6">
              <div className="w-16 h-16 rounded-full bg-[#f1f8f7] flex items-center justify-center mb-4 text-primary">
                <UserCheck className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Médecins qualifiés</h3>
              <p className="text-sm text-gray-500 leading-relaxed max-w-[200px]">
                Des professionnels de santé vérifiés et expérimentés.
              </p>
            </div>
            <div className="flex flex-col items-center text-center lg:px-6">
              <div className="w-16 h-16 rounded-full bg-[#f1f8f7] flex items-center justify-center mb-4 text-primary">
                <MapPinIcon className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Près de chez vous</h3>
              <p className="text-sm text-gray-500 leading-relaxed max-w-[200px]">
                Trouvez des médecins proches de votre position.
              </p>
            </div>
            <div className="flex flex-col items-center text-center lg:px-6">
              <div className="w-16 h-16 rounded-full bg-[#f1f8f7] flex items-center justify-center mb-4 text-primary">
                <Bell className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Rappels automatiques</h3>
              <p className="text-sm text-gray-500 leading-relaxed max-w-[200px]">
                Recevez des rappels pour ne jamais manquer votre rendez-vous.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. STATS BANNER */}
      <section className="py-8 bg-white">
        <div className="container max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="bg-[#f8fafc] rounded-3xl p-6 lg:p-10 border border-gray-100 flex flex-wrap justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#e8f1f2] flex items-center justify-center text-primary">
                <Smile className="w-7 h-7" />
              </div>
              <div>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900">100% Gratuit</p>
                <p className="text-sm font-medium text-gray-600">Pour les patients</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#e8f1f2] flex items-center justify-center text-primary">
                <Clock className="w-7 h-7" />
              </div>
              <div>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900">24/7</p>
                <p className="text-sm font-medium text-gray-600">Prise de rendez-vous</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#e8f1f2] flex items-center justify-center text-primary">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900">Sécurisé</p>
                <p className="text-sm font-medium text-gray-600">Données médicales protégées</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#e8f1f2] flex items-center justify-center text-primary">
                <Smartphone className="w-7 h-7" />
              </div>
              <div>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900">Simple</p>
                <p className="text-sm font-medium text-gray-600">Accessible sur tous vos écrans</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section className="py-14 bg-white" id="how-it-works">
        <div className="container max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Comment ça marche ?</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative z-0">
            
            {/* Continuous dashed line connecting the centers of the circles on desktop */}
            <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] border-t-2 border-dashed border-gray-300 -z-10"></div>

            {/* Step 1 */}
            <div className="flex flex-col items-center text-center px-4">
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-[#e8f1f2] rounded-full flex items-center justify-center">
                  <Smartphone className="w-10 h-10 text-primary" strokeWidth={1.5} />
                </div>
                <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold border-4 border-white shadow-sm">
                  1
                </div>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Recherchez</h3>
              <p className="text-sm text-gray-500">Trouvez un médecin par spécialité ou par ville.</p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center px-4">
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-[#e8f1f2] rounded-full flex items-center justify-center">
                  <MousePointerClick className="w-10 h-10 text-primary" strokeWidth={1.5} />
                </div>
                <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold border-4 border-white shadow-sm">
                  2
                </div>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Choisissez</h3>
              <p className="text-sm text-gray-500">Sélectionnez la date et l'heure qui vous convient.</p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center px-4">
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-[#e8f1f2] rounded-full flex items-center justify-center">
                  <FileText className="w-10 h-10 text-primary" strokeWidth={1.5} />
                </div>
                <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold border-4 border-white shadow-sm">
                  3
                </div>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Remplissez</h3>
              <p className="text-sm text-gray-500">Ajoutez vos informations et le motif de votre consultation.</p>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center px-4">
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-[#e8f1f2] rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-primary" strokeWidth={1.5} />
                </div>
                <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold border-4 border-white shadow-sm">
                  4
                </div>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Confirmez</h3>
              <p className="text-sm text-gray-500">Recevez la confirmation de votre rendez-vous immédiatement.</p>
            </div>

          </div>
        </div>
      </section>

      {/* 5. CTA BANNER */}
      <section className="pb-10 bg-white">
        <div className="container max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="bg-[#e8f1f2] rounded-3xl overflow-hidden relative flex flex-col md:flex-row items-center">

            {/* Left Content */}
            <div className="p-10 lg:p-16 flex-1 z-10">
              <h2 className="text-3xl font-bold text-[#1e293b] mb-4">Votre santé mérite le meilleur</h2>
              <p className="text-gray-600 mb-8 max-w-md">
                Rejoignez des milliers de patients qui nous font déjà confiance.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/search"
                  className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  Trouver un médecin
                  <Search className="w-4 h-4" />
                </Link>
                <button className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                  En savoir plus
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Illustration */}
            <div className="hidden md:block w-1/3 shrink-0 self-end mr-10 z-0">
              <img
                src="/images/algiers-monument.png"
                alt="Maqam Echahid Alger"
                className="w-full h-auto opacity-80 mix-blend-multiply"
              />
            </div>

          </div>
        </div>
      </section>

      {/* 6. TRUST FOOTER ROW */}
      <div className="border-t border-gray-100 py-6 bg-white">
        <div className="container max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex flex-wrap items-center justify-center sm:justify-between gap-6 text-sm text-gray-500 font-medium">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              <span>Disponible 7j/7</span>
            </div>
            <div className="flex items-center gap-2">
              <HeadphonesIcon className="w-5 h-5 text-gray-400" />
              <span>Support réactif</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gray-400" />
              <span>Paiement sur place</span>
            </div>
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-gray-400" />
              <span>Sans frais cachés</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
