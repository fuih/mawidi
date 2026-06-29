import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { LayoutDashboard, Users, Bell, ArrowRight, Check, Zap, TrendingDown } from "lucide-react";
import { useTranslation } from "react-i18next";



// Dashboard Mockup Component
function DashboardMockup() {
  const { t } = useTranslation();
  
  const patients = [
    { name: "Amira K.", time: "09:00", status: "En consultation", color: "#039D77" },
    { name: "Rachid B.", time: "09:30", status: t('doctorSection.mockup.stat2'), color: "#F59E0B" },
    { name: "Nour M.", time: "10:00", status: t('doctorSection.mockup.stat2'), color: "#F59E0B" },
    { name: "Karim D.", time: "10:30", status: t('doctorSection.mockup.stat3'), color: "#6366F1" },
  ];

  return (
    <div className="relative">
      {/* Glow behind mockup */}
      <div className="absolute inset-0 bg-[#039D77]/20 rounded-3xl blur-3xl transform scale-90 translate-y-8" />

      <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl overflow-hidden shadow-2xl">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-5 py-4 border-b border-white/10">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400/70" />
            <div className="w-3 h-3 rounded-full bg-amber-400/70" />
            <div className="w-3 h-3 rounded-full bg-green-400/70" />
          </div>
          <div className="flex-1 mx-4 bg-white/5 rounded-lg px-3 py-1 text-xs text-white/40 font-mono">
            {t('doctorSection.mockup.url')}
          </div>
        </div>

        {/* Dashboard content */}
        <div className="p-5">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: t('doctorSection.mockup.stat1'), value: "12", color: "text-[#039D77]" },
              { label: t('doctorSection.mockup.stat2'), value: "3", color: "text-amber-400" },
              { label: t('doctorSection.mockup.stat3'), value: "7", color: "text-blue-400" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 rounded-2xl p-3 text-center">
                <div className={`text-2xl font-black ${stat.color}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {stat.value}
                </div>
                <div className="text-white/40 text-xs mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Patient list */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3 text-start">
              {t('doctorSection.mockup.queue')}
            </div>
            {patients.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
                className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-2xl px-4 py-3 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 text-xs font-bold">
                  {p.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0 text-start">
                  <div className="text-white/90 text-sm font-semibold truncate">{p.name}</div>
                  <div className="text-white/35 text-xs">{p.time}</div>
                </div>
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ color: p.color, background: `${p.color}20` }}
                >
                  {p.status}
                </span>
              </motion.div>
            ))}
          </div>


        </div>
      </div>

      {/* Floating mini cards */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-4 -end-6 bg-white rounded-2xl shadow-lg px-4 py-3 border border-gray-100"
      >
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-[#039D77]" />
          <div className="text-start">
            <div className="text-xs text-gray-400">{t('doctorSection.mockup.noshows')}</div>
            <div className="text-sm font-bold text-[#112142]">−60%</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="absolute -bottom-4 -start-6 bg-white rounded-2xl shadow-lg px-4 py-3 border border-gray-100"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <div className="text-start">
            <div className="text-xs text-gray-400">{t('doctorSection.mockup.timeSaved')}</div>
            <div className="text-sm font-bold text-[#112142]">+2h 30min</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function DoctorSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const mockupY = useTransform(scrollYProgress, [0, 1], [30, -30]);
  const { t } = useTranslation();

  const features = [
    {
      icon: LayoutDashboard,
      title: t('doctorSection.features.dashboard.title'),
      description: t('doctorSection.features.dashboard.description'),
    },
    {
      icon: Users,
      title: t('doctorSection.features.queue.title'),
      description: t('doctorSection.features.queue.description'),
    },
    {
      icon: Bell,
      title: t('doctorSection.features.reminders.title'),
      description: t('doctorSection.features.reminders.description'),
    },
  ];

  const perks = t('doctorSection.perks', { returnObjects: true }) as string[];

  return (
    <section
      id="doctors"
      className="relative py-28 lg:py-40 overflow-hidden"
      style={{ background: "#112142" }}
    >
      {/* Background textures */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -end-40 w-[600px] h-[600px] rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, #039D77 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-40 -start-40 w-[500px] h-[500px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #039D77 0%, transparent 70%)" }}
        />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left — Content */}
          <div ref={ref}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7 }}
            >
              <span className="inline-block text-[#039D77] text-sm font-bold tracking-widest uppercase mb-6 bg-[#039D77]/15 px-4 py-2 rounded-full border border-[#039D77]/25">
                {t('doctorSection.badge')}
              </span>

              <h2
                className="text-4xl md:text-5xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight mb-6"
              >
                {t('doctorSection.titleStart')}{" "}
                <span className="text-[#039D77]">{t('doctorSection.titleHighlight')}</span>
              </h2>

              <p className="text-white/55 text-lg leading-relaxed mb-10">
                {t('doctorSection.subtitle')}
              </p>
            </motion.div>

            {/* Features */}
            <div className="space-y-6 mb-10">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: -30 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.2 + index * 0.15 }}
                    className="flex gap-4 group"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-[#039D77]/15 border border-[#039D77]/25 flex items-center justify-center group-hover:bg-[#039D77]/25 transition-colors duration-300">
                      <Icon className="w-6 h-6 text-[#039D77]" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3
                        className="text-base font-bold text-white mb-1"
                      >
                        {feature.title}
                      </h3>
                      <p className="text-white/45 text-sm leading-relaxed">{feature.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Perks grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="grid grid-cols-2 gap-2 mb-10"
            >
              {perks.map((perk) => (
                <div key={perk} className="flex items-center gap-2 text-sm text-white/60">
                  <Check className="w-4 h-4 text-[#039D77] flex-shrink-0" />
                  <span>{perk}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <a
                href="#"
                className="px-6 py-3 bg-[#039D77] hover:bg-[#027a5c] text-white font-semibold rounded-xl text-center transition-all duration-300 hover:shadow-emerald-lg flex items-center justify-center gap-2 group"
              >
                <span className="ltr:hidden rtl:inline"><ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform rotate-180" /></span>
                {t('doctorSection.cta')}
                <span className="rtl:hidden"><ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></span>
              </a>
            </motion.div>
          </div>

          {/* Right — Dashboard Mockup */}
          <motion.div
            style={{ y: mockupY }}
            initial={{ opacity: 0, scale: 0.9, x: 40 }}
            animate={inView ? { opacity: 1, scale: 1, x: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <DashboardMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
