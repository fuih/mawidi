import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  HeartPulse,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  UserCheck,
} from "lucide-react";

const specialties = [
  "Cardiologie",
  "Dermatologie",
  "Pediatrie",
  "Gynecologie",
  "Dentiste",
  "Ophtalmologie",
];

const patientSteps = [
  {
    icon: Search,
    title: "Recherchez",
    text: "Trouvez un medecin par specialite, nom ou ville.",
  },
  {
    icon: CalendarCheck,
    title: "Choisissez",
    text: "Comparez les disponibilites et selectionnez un horaire.",
  },
  {
    icon: Bell,
    title: "Confirmez",
    text: "Recevez votre confirmation et vos rappels au bon moment.",
  },
];

const doctorBenefits = [
  "Agenda en ligne synchronise avec votre cabinet",
  "Rappels automatiques pour limiter les rendez-vous oublies",
  "Profil public clair pour etre trouve plus facilement",
];

const trustItems = [
  { value: "24/7", label: "Reservation accessible" },
  { value: "100%", label: "Gratuit pour les patients" },
  { value: "Securise", label: "Donnees protegees" },
  { value: "Algerie", label: "Pense pour le terrain local" },
];

export function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (city.trim()) params.set("city", city.trim());

    navigate(params.toString() ? `/search?${params.toString()}` : "/search");
  };

  return (
    <div className="min-h-screen overflow-hidden bg-white text-[#112142]">
      <section className="relative isolate bg-[#f6fbfa]">
        <div className="absolute inset-x-0 bottom-0 h-24 bg-white" />
        <div className="container relative mx-auto grid max-w-[1400px] grid-cols-1 gap-10 px-4 pb-12 pt-12 sm:px-6 lg:grid-cols-[0.98fr_1.02fr] lg:items-center lg:px-8 lg:pb-16 lg:pt-16">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#039D77]/15 bg-white px-3 py-2 text-sm font-semibold text-[#039D77] shadow-sm">
              <Sparkles className="h-4 w-4" />
              Mawidi simplifie l'acces aux soins
            </div>

            <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-normal text-[#112142] sm:text-5xl lg:text-6xl">
              Prenez rendez-vous avec le bon medecin, sans attente inutile.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Recherchez une specialite, choisissez une ville et reservez un
              creneau confirme avec des professionnels de sante en Algerie.
            </p>

            <form
              onSubmit={handleSearch}
              className="mt-8 grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-[0_24px_70px_rgba(17,33,66,0.10)] md:grid-cols-[1fr_0.75fr_auto]"
            >
              <label className="flex min-h-14 items-center gap-3 rounded-md bg-slate-50 px-4">
                <Stethoscope className="h-5 w-5 shrink-0 text-[#039D77]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-[#112142] outline-none placeholder:text-slate-400"
                  placeholder="Specialite, medecin, clinique..."
                />
              </label>
              <label className="flex min-h-14 items-center gap-3 rounded-md bg-slate-50 px-4">
                <MapPin className="h-5 w-5 shrink-0 text-[#039D77]" />
                <input
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-[#112142] outline-none placeholder:text-slate-400"
                  placeholder="Ville ou wilaya"
                />
              </label>
              <button
                type="submit"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-[#039D77] px-7 text-sm font-bold text-white shadow-sm transition hover:bg-[#028765]"
              >
                <Search className="h-5 w-5" />
                Rechercher
              </button>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <span className="font-semibold text-[#112142]">Populaire:</span>
              {specialties.map((specialty) => (
                <Link
                  key={specialty}
                  to={`/search?q=${encodeURIComponent(specialty)}`}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium transition hover:border-[#039D77]/40 hover:text-[#039D77]"
                >
                  {specialty}
                </Link>
              ))}
            </div>
          </div>

          <div className="relative min-h-[430px] lg:min-h-[600px]">
            <div className="absolute inset-0 rounded-[2rem] bg-[#112142]" />
            <div className="absolute -right-10 top-10 h-48 w-48 rounded-full bg-[#039D77]/20 blur-3xl" />
            <div className="absolute -left-8 bottom-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
            <div className="absolute inset-x-4 top-8 overflow-hidden rounded-[1.5rem] border border-white/10 bg-white shadow-[0_30px_90px_rgba(17,33,66,0.22)] sm:inset-x-8">
              <img
                src="/images/ChatGPT%20Image%20Jun%2015,%202026,%2012_50_39%20AM.png"
                alt="Interface de recherche Mawidi"
                className="h-[315px] w-full object-cover object-top sm:h-[390px] lg:h-[430px]"
                loading="eager"
                fetchPriority="high"
              />
            </div>
            <div className="absolute bottom-6 left-4 right-4 grid gap-3 rounded-lg border border-white/15 bg-white p-4 shadow-[0_24px_80px_rgba(17,33,66,0.28)] sm:left-10 sm:right-10 sm:grid-cols-3">
              <div>
                <p className="text-sm font-semibold text-slate-500">Medecins trouves</p>
                <p className="mt-1 text-2xl font-bold text-[#112142]">312</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Creneaux visibles</p>
                <p className="mt-1 text-2xl font-bold text-[#112142]">09:00</p>
              </div>
              <div className="flex items-center justify-between gap-3 sm:justify-start">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Confirmation</p>
                  <p className="mt-1 text-2xl font-bold text-[#112142]">Simple</p>
                </div>
                <div className="rounded-md bg-[#e8f7f3] p-3 text-[#039D77]">
                  <BadgeCheck className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-100 bg-white py-8">
        <div className="container mx-auto grid max-w-[1400px] grid-cols-2 gap-4 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
          {trustItems.map((item) => (
            <div key={item.value} className="py-4">
              <p className="text-2xl font-bold text-[#112142]">{item.value}</p>
              <p className="mt-1 text-sm font-medium text-slate-500">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-white py-16 sm:py-20">
        <div className="container mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#039D77]">
                Pour les patients
              </p>
              <h2 className="mt-3 max-w-2xl text-3xl font-bold text-[#112142] sm:text-4xl">
                Une reservation fluide, depuis la recherche jusqu'au rappel.
              </h2>
            </div>
            <Link
              to="/search"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#039D77] transition hover:text-[#028765]"
            >
              Voir les medecins
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {patientSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <article
                  key={step.title}
                  className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="rounded-md bg-[#e8f7f3] p-3 text-[#039D77]">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-bold text-slate-300">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-[#112142]">{step.title}</h3>
                  <p className="mt-3 leading-7 text-slate-600">{step.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#f6fbfa] py-16 sm:py-20">
        <div className="container mx-auto grid max-w-[1400px] gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#039D77]">
              Pour les cabinets
            </p>
            <h2 className="mt-3 text-3xl font-bold text-[#112142] sm:text-4xl">
              Un agenda moderne pour recevoir mieux, sans alourdir vos journees.
            </h2>
            <p className="mt-5 max-w-xl leading-8 text-slate-600">
              Mawidi donne aux medecins une presence claire en ligne, des
              reservations structurees et une vue simple sur les rendez-vous a venir.
            </p>

            <div className="mt-8 space-y-4">
              {doctorBenefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#039D77]" />
                  <p className="font-medium leading-7 text-slate-700">{benefit}</p>
                </div>
              ))}
            </div>

            <Link
              to="/register/doctor"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-md bg-[#112142] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1b315f]"
            >
              Inscrire mon cabinet
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-[#112142]" />
            <img
              src="/images/dash.png"
              alt="Tableau de bord Mawidi"
              className="relative w-full rounded-xl border border-white/10 object-cover shadow-[0_26px_80px_rgba(17,33,66,0.28)]"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="container mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#039D77]">
                Confiance
              </p>
              <h2 className="mt-3 text-3xl font-bold text-[#112142] sm:text-4xl">
                Une experience rassurante pour chaque rendez-vous.
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-5">
                <ShieldCheck className="h-7 w-7 text-[#039D77]" />
                <h3 className="mt-4 font-bold text-[#112142]">Donnees protegees</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Les informations sensibles restent limitees a ce qui est necessaire.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-5">
                <UserCheck className="h-7 w-7 text-[#039D77]" />
                <h3 className="mt-4 font-bold text-[#112142]">Profils verifies</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Les praticiens disposent d'une fiche claire et exploitable.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-5">
                <MessageCircle className="h-7 w-7 text-[#039D77]" />
                <h3 className="mt-4 font-bold text-[#112142]">Communication simple</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Les informations du rendez-vous restent faciles a retrouver.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-5">
                <HeartPulse className="h-7 w-7 text-[#039D77]" />
                <h3 className="mt-4 font-bold text-[#112142]">Parcours local</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Une interface adaptee aux habitudes des patients en Algerie.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#112142] py-14 text-white">
        <div className="container mx-auto grid max-w-[1400px] gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
          <div>
            <div className="mb-4 flex items-center gap-1 text-[#78e0c8]">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Trouvez un creneau disponible et confirmez votre rendez-vous.
            </h2>
            <p className="mt-4 max-w-2xl leading-8 text-white/70">
              Mawidi rassemble la recherche, la disponibilite et la confirmation
              dans une experience claire sur mobile comme sur ordinateur.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <Link
              to="/search"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[#039D77] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#02b185]"
            >
              Trouver un medecin
              <Search className="h-4 w-4" />
            </Link>
            <Link
              to="/register/doctor"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Vous etes medecin ?
              <Clock3 className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
