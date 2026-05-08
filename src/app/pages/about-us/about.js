"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import Image from "next/image";
import useHelper from "@/components/helper.jsx";

const missionItems = [
  "Demystify complex medical reports through AI-powered plain-language explanations",
  "Empower patients to understand their health conditions and make informed decisions",
  "Provide secure, HIPAA-compliant analysis of sensitive medical documents",
];

const visionItems = [
  "Become the global standard for medical report interpretation",
  "Reduce patient anxiety through immediate, accurate report explanations",
  "Integrate with healthcare systems worldwide to improve patient outcomes",
];

const stats = [
  { icon: "fa6-solid:file-medical", value: "500K+", label: "Reports Analyzed" },
  { icon: "solar:users-group-rounded-line-duotone", value: "250K+", label: "Patients Helped" },
  { icon: "solar:heart-pulse-line-duotone", value: "99.2%", label: "Accuracy Rate" },
  { icon: "mdi:heart-pulse", value: "HIPAA", label: "Compliant" },
];

const teamMembers = [
  {
    name: "Dr. Sarah Johnson",
    role: "Chief Medical Officer",
    bio: "Board-certified physician with 15+ years in clinical diagnostics",
    image: "/team/dr-sarah-johnson.svg",
  },
  {
    name: "Dr. Michael Chen",
    role: "AI Research Director",
    bio: "PhD in Medical AI, former researcher at Stanford Medical AI Lab",
    image: "/team/dr-michael-chen.svg",
  },
  {
    name: "Emily Rodriguez",
    role: "Patient Experience Lead",
    bio: "Healthcare UX specialist focused on patient comprehension",
    image: "/team/emily-rodriguez.svg",
  },
  {
    name: "David Wilson",
    role: "Healthcare Security Officer",
    bio: "HIPAA compliance expert with cybersecurity background",
    image: "/team/david-wilson.svg",
  },
];

const teamMarqueeMembers = [...teamMembers, ...teamMembers];

export default function AboutUsPage() {
  const { currency, setCurrency, toggleTheme, darkMode } = useHelper();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_34%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] text-slate-900 transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.10),transparent_34%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] dark:text-slate-100">
      <header className="sticky top-0 z-50 flex justify-center px-3 pt-3 sm:px-4 sm:pt-5" data-aos="fade-down" data-aos-duration="900">
        <div className="w-full max-w-7xl rounded-3xl border border-white/60 bg-white/80 px-4 py-4 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-6 dark:border-white/10 dark:bg-slate-950/70 sm:rounded-full">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-600/30 dark:bg-cyan-400 dark:text-slate-950">
                    <span className="text-lg font-semibold">M</span>
                  </div>
                  <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Medx<span className="text-blue-600 dark:text-cyan-300">Analysis</span>
                  </span>
                </div>
              </div>
            </Link>

            <nav className="hidden items-center justify-center gap-4 pt-4 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex md:gap-8">
              <Link href="/" className="transition hover:text-blue-600 dark:hover:text-cyan-300">Home</Link>
              <Link href="/pages/about-us" className="transition hover:text-blue-600 dark:hover:text-cyan-300">About Us</Link>
              <Link href="/pages/contact" className="transition hover:text-blue-600 dark:hover:text-cyan-300">Contact</Link>
              <Link href="/pages/privacy-policy" className="transition hover:text-blue-600 dark:hover:text-cyan-300">Privacy Policy</Link>
              <Link href="/pages/term-and-conditions" className="transition hover:text-blue-600 dark:hover:text-cyan-300">Term & Conditions</Link>
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <label className="sr-only" htmlFor="currency-select">Currency</label>
              <div className="relative">
                <select
                  id="currency-select"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="h-11 appearance-none rounded-full border border-slate-200 bg-white px-4 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option>USD</option>
                  <option>PKR</option>
                  <option>EUR</option>
                  <option>GBP</option>
                </select>
                <Icon icon="solar:alt-arrow-down-linear" width={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300" />
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle light and dark mode"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:scale-[1.03] hover:border-blue-500 hover:text-blue-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
              >
                {darkMode ? <Icon icon="solar:moon-linear" width={22} /> : <Icon icon="solar:sun-2-linear" width={22} />}
              </button>

              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:scale-[1.03] hover:border-blue-500 hover:text-blue-600 md:hidden dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
              >
                <Icon icon={mobileMenuOpen ? "solar:close-circle-linear" : "solar:hamburger-menu-linear"} width={22} />
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <nav className="mt-4 max-h-[70vh] space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-700 md:hidden dark:border-white/10 dark:bg-slate-900 dark:text-slate-100">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block rounded-xl px-3 py-2 transition hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-white/5 dark:hover:text-cyan-300">Home</Link>
              <Link href="/pages/about-us" onClick={() => setMobileMenuOpen(false)} className="block rounded-xl px-3 py-2 transition hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-white/5 dark:hover:text-cyan-300">About Us</Link>
              <Link href="/pages/contact" onClick={() => setMobileMenuOpen(false)} className="block rounded-xl px-3 py-2 transition hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-white/5 dark:hover:text-cyan-300">Contact</Link>
              <Link href="/pages/privacy-policy" onClick={() => setMobileMenuOpen(false)} className="block rounded-xl px-3 py-2 transition hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-white/5 dark:hover:text-cyan-300">Privacy Policy</Link>
              <Link href="/pages/term-and-conditions" onClick={() => setMobileMenuOpen(false)} className="block rounded-xl px-3 py-2 transition hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-white/5 dark:hover:text-cyan-300">Term & Conditions</Link>
            </nav>
          )}
        </div>
      </header>

      <section id="hero" className="mx-auto w-full max-w-7xl px-4 pb-16 pt-14 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div data-aos="fade-up">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">Making Medical Reports Understandable</h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
              MediExplain was founded by healthcare professionals and AI experts who believe patients deserve clear,
              jargon-free explanations of their medical results.
            </p>
            <p className="mt-4 text-slate-700 dark:text-slate-300">
              Our mission is to bridge the communication gap between complex medical data and patient understanding
              using cutting-edge artificial intelligence.
            </p>
          </div>

          <div data-aos="zoom-in">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-800">
              <Image
                src="/img/hero-medx.svg"
                alt="Doctor explaining medical report"
                width={800}
                height={520}
                className="h-full w-full object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white/70 py-12 transition-colors duration-300 dark:bg-slate-900/40">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 md:grid-cols-2">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-800">
              <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-blue-600 dark:text-cyan-300">
                <Icon icon="solar:target-line" width={24} />
                Our Mission
              </h2>
              <ul className="space-y-3">
                {missionItems.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Icon icon="solar:check-circle-bold" width={20} className="mt-0.5 shrink-0 text-green-500" />
                    <span className="text-slate-700 dark:text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-800">
              <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-blue-600 dark:text-cyan-300">
                <Icon icon="solar:eye-bold" width={24} />
                Our Vision
              </h2>
              <ul className="space-y-3">
                {visionItems.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Icon icon="clarity:bullseye-line" width={20} className="mt-0.5 shrink-0 text-yellow-500" />
                    <span className="text-slate-700 dark:text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-slate-900">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-slate-800">
                  <Icon icon={stat.icon} width={32} className="text-blue-600 dark:text-cyan-300" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
                <p className="text-slate-600 dark:text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white/70 py-12 transition-colors duration-300 dark:bg-slate-900/40">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-2">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-800">
              <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-blue-600 dark:text-cyan-300">
                <Icon icon="solar:file-check-line-duotone" width={24} />
                Company Registration
              </h3>
              <div className="flex gap-4">
                <Icon icon="solar:file-check-line-duotone" width={24} className="mt-1 text-blue-600 dark:text-cyan-300" />
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white">MediExplain HealthTech Inc.</h5>
                  <p className="text-slate-600 dark:text-slate-400">
                    Registered with Securities and Exchange Commission under healthcare technology regulations
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-800">
              <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-blue-600 dark:text-cyan-300">
                <Icon icon="solar:postcard-line-duotone" width={24} />
                Medical Compliance
              </h3>
              <div className="flex gap-4">
                <Icon icon="solar:postcard-line-duotone" width={24} className="mt-1 text-blue-600 dark:text-cyan-300" />
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white">HIPAA & GDPR Compliant</h5>
                  <p className="text-slate-600 dark:text-slate-400">
                    All patient data is encrypted and processed in accordance with healthcare privacy regulations
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="mb-12 text-center" data-aos="fade-up">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Our Medical & AI Experts</h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600 dark:text-slate-400">
              Meet the team of physicians, data scientists, and engineers dedicated to making healthcare understandable.
            </p>
          </div>

          <div className="mask-[linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] overflow-hidden" data-aos="fade-up">
            <div className="team-marquee-track flex w-max gap-6">
              {teamMarqueeMembers.map((member, index) => (
                <article key={`${member.name}-${index}`} className="w-70 shrink-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-800 sm:w-75">
                  <div className="relative h-56 w-full bg-slate-200 dark:bg-slate-700">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                <div className="p-6 text-center">
                  <h5 className="text-xl font-bold text-slate-900 dark:text-white">{member.name}</h5>
                  <p className="mb-2 text-blue-600 dark:text-cyan-300">{member.role}</p>
                  <p className="text-slate-600 dark:text-slate-400">{member.bio}</p>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <a
                      href="#"
                      aria-label="LinkedIn"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-all hover:bg-blue-600 hover:text-white dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-cyan-400 dark:hover:text-slate-950"
                    >
                      <Icon icon="mdi:linkedin" width={16} />
                    </a>
                    <a
                      href="#"
                      aria-label="GitHub"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-all hover:bg-blue-600 hover:text-white dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-cyan-400 dark:hover:text-slate-950"
                    >
                      <Icon icon="mdi:github" width={16} />
                    </a>
                  </div>
                </div>
              </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer id="footer" className="border-t border-slate-200/70 bg-white/60 pb-8 pt-16 transition-colors duration-300 dark:border-slate-700 dark:bg-slate-950/50">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="mb-4">
              <div className="flex h-10 items-center px-0 sm:px-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-600/30 dark:bg-cyan-400 dark:text-slate-950">
                    <span className="text-lg font-semibold">M</span>
                  </div>
                  <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Medx<span className="text-blue-600 dark:text-cyan-300">Analysis</span>
                  </span>
                </div>
              </div>
            </div>
            <p className="px-0 text-gray-600 dark:text-gray-400 sm:px-4">
              AI-powered medical report interpretation for patients who deserve clarity.
            </p>
          </div>

          <div>
            <h5 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Quick Links</h5>
            <div className="flex flex-wrap gap-4">
              <Link href="/" className="text-gray-600 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-cyan-300">Home</Link>
              <Link href="/pages/about-us" className="text-gray-600 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-cyan-300">About Us</Link>
              <Link href="/pages/contact" className="text-gray-600 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-cyan-300">Contact</Link>
              <Link href="/pages/privacy-policy" className="text-gray-600 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-cyan-300">Privacy Policy</Link>
              <Link href="/pages/term-and-conditions" className="text-gray-600 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-cyan-300">Term & Conditions</Link>
            </div>
          </div>

          <div>
            <h5 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Newsletter</h5>
            <p className="text-gray-600 dark:text-gray-400">Get health tips and AI insights monthly.</p>
            <form className="mt-4 flex flex-col gap-2 sm:flex-row">
              <div className="w-full sm:w-auto">
                <label className="sr-only" htmlFor="newsletter-email">Your Email</label>
                <input type="email" id="newsletter-email" name="newsletter_email" className="h-12 w-full rounded-full border border-slate-200 bg-transparent px-4 text-sm outline-none transition focus:border-blue-500 dark:border-white/10 dark:focus:border-cyan-400" placeholder="Your Email" required />
              </div>
              <button type="submit" className="inline-flex h-12 min-w-30 items-center justify-center gap-2 rounded-full bg-blue-600 px-5 text-white transition hover:bg-blue-700 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300">
                Subscribe
                <Icon icon="prime:send" width={18} />
              </button>
            </form>
          </div>
        </div>

        <div className="mx-auto mt-10 flex w-full max-w-7xl justify-center px-4 sm:px-6">
          <div className="flex space-x-4">
            <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-700 transition-all hover:bg-blue-600 hover:text-white dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-cyan-400 dark:hover:text-slate-950"><Icon icon="mdi:facebook" width={20} /></a>
            <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-700 transition-all hover:bg-blue-600 hover:text-white dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-cyan-400 dark:hover:text-slate-950"><Icon icon="prime:twitter" width={20} /></a>
            <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-700 transition-all hover:bg-blue-600 hover:text-white dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-cyan-400 dark:hover:text-slate-950"><Icon icon="mdi:linkedin" width={20} /></a>
            <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-700 transition-all hover:bg-blue-600 hover:text-white dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-cyan-400 dark:hover:text-slate-950"><Icon icon="mdi:instagram" width={20} /></a>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-7xl border-t border-gray-300 px-4 pt-6 text-center dark:border-slate-700 sm:px-6">
          <span className="text-gray-600 dark:text-gray-400">
            Copyright © <span id="year">2024</span>{" "}
            <Link href="/" className="text-blue-600 hover:underline dark:text-cyan-300">Medx Analysis.</Link>{" "}
            AI-powered medical insights.
          </span>
        </div>
      </footer>

      <style jsx>{`
        .team-marquee-track {
          animation: team-marquee 28s linear infinite;
        }

        @keyframes team-marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .team-marquee-track {
            animation: none;
          }
        }
      `}</style>
    </main>
  );
}
