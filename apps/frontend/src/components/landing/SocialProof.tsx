import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Shield, Compass, Zap, Rocket } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function SocialProof() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const { t } = useTranslation();

  const stats = [
    {
      icon: Compass,
      value: t('socialProof.stat1Value'),
      label: t('socialProof.stat1Label'),
      sublabel: t('socialProof.stat1Sub'),
    },
    {
      icon: Shield,
      value: t('socialProof.stat2Value'),
      label: t('socialProof.stat2Label'),
      sublabel: t('socialProof.stat2Sub'),
    },
    {
      icon: Zap,
      value: t('socialProof.stat3Value'),
      label: t('socialProof.stat3Label'),
      sublabel: t('socialProof.stat3Sub'),
    },
    {
      icon: Rocket,
      value: t('socialProof.stat4Value'),
      label: t('socialProof.stat4Label'),
      sublabel: t('socialProof.stat4Sub'),
    },
  ];

  return (
    <section className="relative py-28 lg:py-40 overflow-hidden" style={{ background: "#F8FAFC" }}>
      {/* Background decoration */}
      <div
        className="absolute top-0 end-0 w-96 h-96 rounded-full opacity-[0.04] pointer-events-none"
        style={{ background: "radial-gradient(circle, #039D77 0%, transparent 70%)", transform: "translate(30%, -30%)" }}
      />
      <div
        className="absolute bottom-0 start-0 w-80 h-80 rounded-full opacity-[0.04] pointer-events-none"
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
            {t('socialProof.mission')}
          </span>
          <h2
            className="text-4xl md:text-5xl font-extrabold text-[#112142] leading-tight"
          >
            {t('socialProof.titleStart')}{" "}
            <span className="text-[#039D77]">{t('socialProof.titleHighlight')}</span>
          </h2>
          <p className="mt-4 text-lg text-[#112142]/55 max-w-xl mx-auto">
            {t('socialProof.subtitle')}
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