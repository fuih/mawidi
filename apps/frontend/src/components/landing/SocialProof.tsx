import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Shield, Clock, Compass, Zap, Rocket, Award, Lock } from "lucide-react";

const stats = [
  {
    icon: Compass,
    value: "Vision",
    label: "Santé connectée",
    sublabel: "Moderniser l'accès aux soins en Algérie.",
  },
  {
    icon: Shield,
    value: "100%",
    label: "Sécurité & Privée",
    sublabel: "Vos données médicales restent confidentielles.",
  },
  {
    icon: Zap,
    value: "Simple",
    label: "Prise de RDV rapide",
    sublabel: "Supprimer l'attente au téléphone.",
  },
  {
    icon: Rocket,
    value: "En route",
    label: "Déploiement progressif",
    sublabel: "Inscrivez-vous pour votre wilaya.",
  },
];

const badges = [
  { icon: Shield, text: "Données sécurisées & confidentielles", color: "text-[#039D77]", bg: "bg-[#039D77]/8" },
  { icon: Award, text: "Seuls les praticiens diplômés seront référencés", color: "text-blue-600", bg: "bg-blue-50" },
  { icon: Lock, text: "Plateforme conforme aux normes de santé", color: "text-amber-500", bg: "bg-amber-50" },
];

const wilayas = [
  "Alger", "Oran", "Constantine", "Annaba", "Blida", "Batna",
  "Djelfa", "Sétif", "Sidi Bel Abbès", "Biskra", "Tébessa",
  "El Oued", "Skikda", "Tiaret", "Béjaïa", "Tlemcen",
];

export default function SocialProof() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [email, setEmail] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [role, setRole] = useState("patient");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStatus("success");
      setEmail("");
      setWilaya("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="relative py-28 lg:py-40 overflow-hidden" style={{ background: "#F8FAFC" }}>
      {/* Background decoration */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-[0.04] pointer-events-none"
        style={{ background: "radial-gradient(circle, #039D77 0%, transparent 70%)", transform: "translate(30%, -30%)" }}
      />
      <div
        className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-[0.04] pointer-events-none"
        style={{ background: "radial-gradient(circle, #112142 0%, transparent 70%)", transform: "translate(-30%, 30%)" }}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-[#039D77] text-sm font-bold tracking-widest uppercase mb-4 bg-[#039D77]/8 px-4 py-2 rounded-full">
            Notre Mission
          </span>
          <h2
            className="text-4xl md:text-5xl font-extrabold text-[#112142] leading-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Construire le futur de{" "}
            <span className="text-[#039D77]">la santé en Algérie</span>
          </h2>
          <p className="mt-4 text-lg text-[#112142]/55 max-w-xl mx-auto">
            Mawidi est en cours de déploiement. Voici ce que nous construisons pour vous.
          </p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.1 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="group bg-white border border-gray-100 hover:border-[#039D77]/20 rounded-3xl p-6 text-center hover:shadow-glass-lg transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#039D77]/8 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-6 h-6 text-[#039D77]" strokeWidth={1.5} />
                </div>
                <div
                  className="text-2xl lg:text-3xl font-black text-[#112142] mb-1"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {stat.value}
                </div>
                <div className="text-sm font-semibold text-[#112142]/80 mb-1">{stat.label}</div>
                <div className="text-xs text-[#112142]/40">{stat.sublabel}</div>
              </motion.div>
            );
          })}
        </div>


      </div>
    </section>
  );
}