import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Search, CalendarCheck, BellRing } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Recherchez un spécialiste",
    description:
      "Entrez la spécialité souhaitée ou le nom du médecin, puis sélectionnez votre ville ou wilaya pour obtenir une liste de praticiens certifiés près de chez vous.",
    color: "#039D77",
    bgColor: "bg-[#039D77]/8",
    offset: "lg:mt-0",
  },
  {
    number: "02",
    icon: CalendarCheck,
    title: "Choisissez votre créneau",
    description:
      "Consultez les disponibilités en temps réel, et réservez un créneau horaire précis ou rejoignez la file d'attente du cabinet en direct.",
    color: "#039D77",
    bgColor: "bg-[#039D77]/8",
    offset: "lg:mt-16",
  },
  {
    number: "03",
    icon: BellRing,
    title: "Confirmation & suivi",
    description:
      "Recevez une confirmation de votre rendez-vous et suivez son statut directement depuis votre espace patient pour ne rien manquer.",
    color: "#039D77",
    bgColor: "bg-[#039D77]/8",
    offset: "lg:mt-6",
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="how-it-works" className="relative py-28 lg:py-40 bg-white overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#039D77]/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#039D77]/20 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-20"
        >
          <span className="inline-block text-[#039D77] text-sm font-bold tracking-widest uppercase mb-4 bg-[#039D77]/8 px-4 py-2 rounded-full">
            Simple & Rapide
          </span>
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#112142] leading-tight tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Comment ça{" "}
            <span className="text-[#039D77]">fonctionne ?</span>
          </h2>
          <p className="mt-5 text-lg text-[#112142]/55 max-w-xl mx-auto leading-relaxed">
            Prendre un rendez-vous médical n'a jamais été aussi simple. En moins d'une minute, c'est réglé.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="hidden lg:block absolute top-16 left-[calc(16.667%-40px)] right-[calc(16.667%-40px)] h-px">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : {}}
              transition={{ duration: 1.2, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="h-full origin-left"
              style={{
                background: "linear-gradient(90deg, #039D77 0%, #039D77 100%)",
                opacity: 0.25,
              }}
            />
            {/* Pulse dots on line */}
            {[25, 50, 75].map((pos) => (
              <motion.div
                key={pos}
                initial={{ opacity: 0, scale: 0 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.8 + pos / 200, duration: 0.4 }}
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#039D77]/40"
                style={{ left: `${pos}%` }}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 50 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{
                    duration: 0.7,
                    delay: 0.2 + index * 0.15,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={`relative group ${step.offset}`}
                >
                  <div className="bg-[#F8FAFC] hover:bg-white border border-gray-100 hover:border-[#039D77]/20 rounded-3xl p-8 transition-all duration-300 hover:shadow-glass-lg">
                    {/* Step number */}
                    <div className="flex items-start justify-between mb-6">
                      <div className={`w-16 h-16 ${step.bgColor} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
                        <Icon className="w-8 h-8" style={{ color: step.color }} strokeWidth={1.5} />
                      </div>
                      <span
                        className="text-6xl font-black leading-none"
                        style={{ color: "#112142", opacity: 0.06, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        {step.number}
                      </span>
                    </div>

                    {/* Content */}
                    <h3
                      className="text-xl font-bold text-[#112142] mb-3"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      {step.title}
                    </h3>
                    <p className="text-[#112142]/55 leading-relaxed text-sm">
                      {step.description}
                    </p>

                    {/* Bottom accent */}
                    <div className="mt-6 h-0.5 w-12 bg-[#039D77]/30 rounded-full group-hover:w-24 transition-all duration-500" />
                  </div>

                  {/* Arrow connector (mobile) */}
                  {index < steps.length - 1 && (
                    <div className="lg:hidden flex justify-center mt-4">
                      <div className="w-0.5 h-8 bg-gradient-to-b from-[#039D77]/30 to-transparent" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}