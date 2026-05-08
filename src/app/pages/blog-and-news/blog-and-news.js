"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import useHelper from "@/components/helper.jsx";

export default function BlogAndNewsPage() {
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
              <Link href="/pages/term-and-conditions" className="transition hover:text-blue-600 dark:hover:text-cyan-300">Terms & Conditions</Link>
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
              <Link href="/pages/term-and-conditions" onClick={() => setMobileMenuOpen(false)} className="block rounded-xl px-3 py-2 transition hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-white/5 dark:hover:text-cyan-300">Terms & Conditions</Link>
            </nav>
          )}
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-4 py-24 sm:px-6 md:py-32" data-aos="fade-up">
        <div className="relative flex max-w-3xl flex-col items-center text-center">
          <div className="absolute -top-12 left-1/2 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl dark:bg-cyan-500/10" />
          
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-4xl bg-white shadow-xl shadow-blue-500/10 dark:bg-slate-900 dark:shadow-cyan-500/10">
            <Icon icon="solar:rocket-bold-duotone" width={48} className="text-blue-600 dark:text-cyan-400" />
          </div>
          
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-blue-600 dark:text-cyan-400">Under Construction</p>
          <h1 className="mb-6 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">We&quot;re launching our Blog & News very soon!</h1>
          
          <p className="mb-10 text-lg leading-8 text-slate-600 dark:text-slate-300 sm:text-xl">
            We are cooking up some amazing insights and updates around AI-driven medical analysis. Check back later for the latest health tips and platform announcements.
          </p>

          <Link href="/" className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-slate-950 px-8 text-base font-semibold text-white transition hover:-translate-y-1 hover:shadow-xl dark:bg-cyan-400 dark:text-slate-950 dark:hover:shadow-cyan-400/25">
            <Icon icon="solar:home-smile-outline" width={22} />
            Back to Homepage
          </Link>
        </div>
      </section>

      <footer id="footer" className="mt-auto border-t border-slate-200/70 bg-white/60 pb-8 pt-16 transition-colors duration-300 dark:border-slate-700 dark:bg-slate-950/50">
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
            <p className="px-0 text-gray-600 dark:text-gray-400 sm:px-4">AI-powered medical report interpretation for patients who deserve clarity.</p>
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
          <span className="text-gray-600 dark:text-gray-400">Copyright © <span id="year">2024</span>{" "}<Link href="/" className="text-blue-600 hover:underline dark:text-cyan-300">Medx Analysis.</Link>{" "}AI-powered medical insights.</span>
        </div>
      </footer>
    </main>
  );
}
