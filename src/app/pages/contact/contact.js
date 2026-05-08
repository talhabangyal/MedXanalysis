"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import useHelper from "@/components/helper.jsx";
import { apiClient } from "@/lib/api-client";

export default function ContactPage() {
  const { currency, setCurrency, toggleTheme, darkMode } = useHelper();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    subject: '',
    message: '',
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

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
              <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="block rounded-xl px-3 py-2 transition hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-white/5 dark:hover:text-cyan-300">Contact</a>
              <Link href="/pages/privacy-policy" onClick={() => setMobileMenuOpen(false)} className="block rounded-xl px-3 py-2 transition hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-white/5 dark:hover:text-cyan-300">Privacy Policy</Link>
              <Link href="/pages/term-and-conditions" onClick={() => setMobileMenuOpen(false)} className="block rounded-xl px-3 py-2 transition hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-white/5 dark:hover:text-cyan-300">Term & Conditions</Link>
            </nav>
          )}
        </div>
      </header>

      <section id="contact" className="mx-auto w-full max-w-7xl px-4 pb-16 pt-14 sm:px-6">
        <div className="mb-10 text-center" data-aos="fade-up">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-600 dark:text-cyan-300">Contact</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Get in touch with Medx Analysis</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
            Send us a message if you need help with reports, pricing, or anything else on the platform.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr,0.95fr]">
          <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-slate-900 sm:p-8" data-aos="fade-up">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-cyan-500/10 dark:text-cyan-300">
                <Icon icon="solar:chat-round-linear" width={24} />
              </span>
              <div>
                <h3 className="text-xl font-bold">Still have questions?</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">Send a message and we will get back to you.</p>
              </div>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setContactLoading(true);
              try {
                await apiClient.admin.createMessage({
                  first_name: contactForm.firstName,
                  last_name: contactForm.lastName,
                  email: contactForm.email,
                  subject: contactForm.subject,
                  body: contactForm.message,
                });
                setContactSuccess(true);
                setContactForm({ firstName: '', lastName: '', email: '', subject: '', message: '' });
                setTimeout(() => setContactSuccess(false), 5000);
              } catch (err) {
                console.error('Failed to send message:', err);
                alert('Failed to send message. Please try again.');
              } finally {
                setContactLoading(false);
              }
            }} className="space-y-4">
              {contactSuccess && (
                <div className="rounded-2xl bg-emerald-100 p-4 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  Thank you! Your message has been sent. We&apos;ll get back to you soon.
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="contact-first-name" className="text-sm font-medium text-slate-700 dark:text-slate-200">First Name</label>
                  <input
                    id="contact-first-name"
                    type="text"
                    placeholder="John"
                    value={contactForm.firstName}
                    onChange={(e) => setContactForm({...contactForm, firstName: e.target.value})}
                    required
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-transparent px-4 text-sm outline-none transition focus:border-blue-500 dark:border-white/10 dark:focus:border-cyan-400"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="contact-last-name" className="text-sm font-medium text-slate-700 dark:text-slate-200">Last Name</label>
                  <input
                    id="contact-last-name"
                    type="text"
                    placeholder="Doe"
                    value={contactForm.lastName}
                    onChange={(e) => setContactForm({...contactForm, lastName: e.target.value})}
                    required
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-transparent px-4 text-sm outline-none transition focus:border-blue-500 dark:border-white/10 dark:focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="contact-email" className="text-sm font-medium text-slate-700 dark:text-slate-200">Email Address</label>
                <input
                  id="contact-email"
                  type="email"
                  placeholder="john@example.com"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                  required
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-transparent px-4 text-sm outline-none transition focus:border-blue-500 dark:border-white/10 dark:focus:border-cyan-400"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="contact-subject" className="text-sm font-medium text-slate-700 dark:text-slate-200">Subject</label>
                <input
                  id="contact-subject"
                  type="text"
                  placeholder="How does the service work?"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                  required
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-transparent px-4 text-sm outline-none transition focus:border-blue-500 dark:border-white/10 dark:focus:border-cyan-400"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="contact-message" className="text-sm font-medium text-slate-700 dark:text-slate-200">Your Message</label>
                <textarea
                  id="contact-message"
                  rows={5}
                  placeholder="Write your question here..."
                  value={contactForm.message}
                  onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-blue-500 dark:border-white/10 dark:focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                disabled={contactLoading}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-slate-950 px-6 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-50 dark:bg-cyan-400 dark:text-slate-950"
              >
                {contactLoading && <Icon icon="eos-icons:loading" width={18} />}
                Send Message
              </button>
            </form>
          </div>

          <div className="flex flex-col gap-6 rounded-4xl border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-slate-900 sm:p-8" data-aos="fade-up" data-aos-delay="100">
            <div>
              <h3 className="mb-6 text-2xl font-bold">Contact Information</h3>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                Prefer to reach out directly? Use any of the methods below. Our support team is available Monday through Friday, 9am - 5pm EST.
              </p>
            </div>

            <div className="flex flex-col gap-6 rounded-2xl bg-slate-50 p-6 dark:bg-slate-800/50">
              <div className="flex gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-cyan-300">
                  <Icon icon="solar:map-point-linear" width={24} />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Our Headquarters</h4>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    123 Innovation Drive<br />
                    HealthTech Park, Suite 400<br />
                    San Francisco, CA 94103
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-cyan-300">
                  <Icon icon="solar:letter-linear" width={24} />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Email Us</h4>
                  <a href="mailto:support@medxanalysis.com" className="mt-1 block text-sm text-blue-600 transition hover:text-blue-700 dark:text-cyan-300 dark:hover:text-cyan-200">
                    support@medxanalysis.com
                  </a>
                  <a href="mailto:partnerships@medxanalysis.com" className="block text-sm text-blue-600 transition hover:text-blue-700 dark:text-cyan-300 dark:hover:text-cyan-200">
                    partnerships@medxanalysis.com
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-cyan-300">
                  <Icon icon="solar:phone-calling-linear" width={24} />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Call Us</h4>
                  <a href="tel:+18005550198" className="mt-1 block text-sm text-slate-600 transition hover:text-blue-600 dark:text-slate-300 dark:hover:text-cyan-300">
                    +1 (800) 555-0198
                  </a>
                  <a href="tel:+18005550199" className="block text-sm text-slate-600 transition hover:text-blue-600 dark:text-slate-300 dark:hover:text-cyan-300">
                    +1 (800) 555-0199 (Support)
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6 flex flex-col items-center">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Follow Us</h4>
              <div className="mt-3 flex gap-3">
                <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-blue-600 hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-cyan-400 dark:hover:text-slate-950">
                  <Icon icon="mdi:twitter" width={20} />
                </a>
                <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-blue-600 hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-cyan-400 dark:hover:text-slate-950">
                  <Icon icon="mdi:linkedin" width={20} />
                </a>
                <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-blue-600 hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-cyan-400 dark:hover:text-slate-950">
                  <Icon icon="mdi:instagram" width={20} />
                </a>
              </div>
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
    </main>
  );
}
