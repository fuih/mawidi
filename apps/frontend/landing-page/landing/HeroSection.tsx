import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, ChevronDown, Stethoscope, ArrowRight } from "lucide-react";

const specialties = [
  "Médecine générale", "Cardiologie", "Dermatologie", "Pédiatrie",
  "Gynécologie", "Ophtalmologie", "Orthopédie", "Neurologie",
  "Psychiatrie", "Radiologie", "Dentiste", "ORL",
];

const wilayas = [
  "Alger", "Oran", "Constantine", "Annaba", "Blida", "Batna",
  "Djelfa", "Sétif", "Sidi Bel Abbès", "Biskra", "Tébessa",
  "El Oued", "Skikda", "Tiaret", "Béjaïa", "Tlemcen",
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const searchBarVariants = {
  hidden: { opacity: 0, y: 60, scale: 0.96 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }
  },
};

export default function HeroSection() {
  const [specialty, setSpecialty] = useState("");
  const [wilaya, setWilaya] = useState("");

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#F8FAFC] pt-20"
    >
      {/* Abstract Bio-Blob backgrounds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="animate-blob absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, #039D77 0%, transparent 70%)" }}
        />
        <div
          className="animate-blob animation-delay-2000 absolute top-20 -right-20 w-[500px] h-[500px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #039D77 0%, transparent 70%)" }}
        />
        <div
          className="animate-blob animation-delay-4000 absolute -bottom-40 left-1/3 w-[700px] h-[700px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, #112142 0%, transparent 70%)" }}
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(#039D77 1px, transparent 1px), linear-gradient(90deg, #039D77 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Heartbeat SVG decoration */}
      <div className="absolute top-1/3 right-8 lg:right-16 opacity-10 pointer-events-none hidden lg:block">
        <svg width="280" height="80" viewBox="0 0 280 80" fill="none">
          <path
            d="M0 40 L40 40 L55 10 L70 70 L85 25 L100 55 L115 40 L280 40"
            stroke="#039D77"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Medical SVG decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Pill — top left */}
        <svg className="absolute top-28 left-10 lg:left-24 opacity-[0.07] rotate-[-30deg]" width="80" height="36" viewBox="0 0 80 36">
          <rect x="1" y="1" width="78" height="34" rx="17" ry="17" fill="none" stroke="#039D77" strokeWidth="2.5" />
          <line x1="40" y1="1" x2="40" y2="35" stroke="#039D77" strokeWidth="2.5" />
        </svg>

        {/* Plus / cross — top right */}
        <svg className="absolute top-24 right-16 lg:right-32 opacity-[0.06]" width="44" height="44" viewBox="0 0 44 44">
          <rect x="17" y="0" width="10" height="44" rx="3" fill="#039D77" />
          <rect x="0" y="17" width="44" height="10" rx="3" fill="#039D77" />
        </svg>

        {/* Capsule — mid right */}
        <svg className="absolute top-1/2 right-8 lg:right-20 opacity-[0.055] rotate-[20deg]" width="60" height="28" viewBox="0 0 60 28">
          <rect x="1" y="1" width="58" height="26" rx="13" ry="13" fill="none" stroke="#112142" strokeWidth="2" />
          <line x1="30" y1="1" x2="30" y2="27" stroke="#112142" strokeWidth="2" />
        </svg>

        {/* Small plus — bottom left */}
        <svg className="absolute bottom-44 left-12 lg:left-28 opacity-[0.06]" width="30" height="30" viewBox="0 0 30 30">
          <rect x="11" y="0" width="8" height="30" rx="2" fill="#039D77" />
          <rect x="0" y="11" width="30" height="8" rx="2" fill="#039D77" />
        </svg>

        {/* Pill — bottom right */}
        <svg className="absolute bottom-32 right-10 lg:right-36 opacity-[0.06] rotate-[50deg]" width="64" height="28" viewBox="0 0 64 28">
          <rect x="1" y="1" width="62" height="26" rx="13" ry="13" fill="none" stroke="#039D77" strokeWidth="2" />
          <line x1="32" y1="1" x2="32" y2="27" stroke="#039D77" strokeWidth="2" />
        </svg>

        {/* Stethoscope circle accent — far left mid */}
        <svg className="absolute top-2/3 left-6 lg:left-16 opacity-[0.05]" width="48" height="48" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="22" fill="none" stroke="#112142" strokeWidth="2" strokeDasharray="6 4" />
          <circle cx="24" cy="24" r="8" fill="none" stroke="#039D77" strokeWidth="2" />
        </svg>

        {/* Large faded plus — center background */}
        <svg className="absolute top-1/4 left-1/2 -translate-x-1/2 opacity-[0.025]" width="120" height="120" viewBox="0 0 120 120">
          <rect x="45" y="0" width="30" height="120" rx="8" fill="#039D77" />
          <rect x="0" y="45" width="120" height="30" rx="8" fill="#039D77" />
        </svg>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-16"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="flex justify-center mb-8">
            <span className="inline-flex items-center gap-2 bg-[#039D77]/10 text-[#039D77] text-sm font-semibold px-5 py-2 rounded-full border border-[#039D77]/20">
              <span className="w-2 h-2 rounded-full bg-[#039D77] animate-pulse" />
              Disponible dans toutes les wilayas d'Algérie
            </span>
          </motion.div>

          {/* H1 */}
          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#112142] leading-[1.05] tracking-tight text-balance mb-6"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Votre santé{" "}
            <span className="relative">
              <span className="text-[#039D77]">n'attend pas.</span>
              <svg
                className="absolute -bottom-2 left-0 w-full"
                height="8"
                viewBox="0 0 300 8"
                fill="none"
              >
                <path
                  d="M0 6 Q75 1 150 6 Q225 11 300 6"
                  stroke="#039D77"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.4"
                />
              </svg>
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-[#112142]/60 font-medium leading-relaxed max-w-2xl mx-auto"
          >
            Trouvez le bon médecin, choisissez un créneau et confirmez votre rendez-vous en quelques secondes — 24h/24, 7j/7.
          </motion.p>
        </motion.div>

        {/* Search Card */}
        <motion.div
          variants={searchBarVariants}
          initial="hidden"
          animate="visible"
          className="relative mx-auto max-w-4xl"
        >
          {/* Glow behind card */}
          <div className="absolute inset-0 bg-[#039D77]/10 rounded-3xl blur-2xl transform scale-105" />

          <div className="relative bg-white/75 backdrop-blur-3xl border border-white/80 rounded-3xl shadow-glass-lg p-3 md:p-4">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Specialty field */}
              <div className="flex-1 relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-[#039D77]/10 flex items-center justify-center transition-colors group-focus-within:bg-[#039D77]/20">
                  <Stethoscope className="w-4 h-4 text-[#039D77]" />
                </div>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full pl-16 pr-10 py-4 bg-[#F8FAFC] border border-gray-100 rounded-2xl text-[#112142] font-medium text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#039D77]/30 focus:border-[#039D77]/40 transition-all cursor-pointer hover:border-[#039D77]/30"
                >
                  <option value="">Spécialité ou nom du médecin</option>
                  {specialties.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Wilaya field */}
              <div className="flex-1 relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-[#039D77]/10 flex items-center justify-center transition-colors group-focus-within:bg-[#039D77]/20">
                  <MapPin className="w-4 h-4 text-[#039D77]" />
                </div>
                <select
                  value={wilaya}
                  onChange={(e) => setWilaya(e.target.value)}
                  className="w-full pl-16 pr-10 py-4 bg-[#F8FAFC] border border-gray-100 rounded-2xl text-[#112142] font-medium text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#039D77]/30 focus:border-[#039D77]/40 transition-all cursor-pointer hover:border-[#039D77]/30"
                >
                  <option value="">Ville ou Wilaya</option>
                  {wilayas.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Search button */}
              <button className="animate-pulse-glow flex items-center justify-center gap-2.5 bg-[#039D77] hover:bg-[#027a5c] text-white font-bold text-base px-8 py-4 rounded-2xl transition-all duration-200 hover:scale-[1.02] whitespace-nowrap shadow-emerald-lg">
                <Search className="w-5 h-5" />
                <span>Rechercher</span>
              </button>
            </div>

            {/* Quick tags */}
            <div className="flex flex-wrap gap-2 mt-3 px-1">
              <span className="text-xs text-gray-400 font-medium py-1">Populaires :</span>
              {["Généraliste", "Cardiologue", "Pédiatre", "Dentiste"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSpecialty(tag === "Généraliste" ? "Médecine générale" : specialties.find(s => s.includes(tag.slice(0, -1))) || "")}
                  className="text-xs font-medium text-[#039D77] bg-[#039D77]/8 hover:bg-[#039D77]/15 px-3 py-1 rounded-full transition-colors cursor-pointer border border-[#039D77]/15"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.6 }}
          className="mt-20 flex flex-col items-center gap-2"
        >
          <a href="#how-it-works" className="flex flex-col items-center gap-2 text-[#112142]/30 hover:text-[#039D77] transition-colors group">
            <span className="text-xs font-medium tracking-widest uppercase">Découvrir</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-6 h-10 border-2 border-current rounded-full flex items-start justify-center p-1"
            >
              <div className="w-1.5 h-1.5 bg-current rounded-full" />
            </motion.div>
          </a>
        </motion.div>
      </div>
    </section>
  );
}