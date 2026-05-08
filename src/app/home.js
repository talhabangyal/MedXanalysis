"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import Link from "next/link";
import useHelper from "@/components/helper.jsx";
import { apiClient } from "@/lib/api-client";

function parsePackageFeatures(features) {
  if (!features) {
    return { planType: "individual", tags: [], details: [] };
  }

  if (typeof features === "string") {
    try {
      const parsed = JSON.parse(features);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return {
          planType: parsed.planType || parsed.type || "individual",
          tags: Array.isArray(parsed.tags) ? parsed.tags : [],
          details: Array.isArray(parsed.details) ? parsed.details : [],
        };
      }

      if (Array.isArray(parsed)) {
        return { planType: "individual", tags: [], details: parsed };
      }
    } catch {
      return {
        planType: "individual",
        tags: [],
        details: features.split(",").map((item) => item.trim()).filter(Boolean),
      };
    }
  }

  if (Array.isArray(features)) {
    return { planType: "individual", tags: [], details: features };
  }

  if (typeof features === "object") {
    return {
      planType: features.planType || features.type || "individual",
      tags: Array.isArray(features.tags) ? features.tags : [],
      details: Array.isArray(features.details) ? features.details : [],
    };
  }

  return { planType: "individual", tags: [], details: [] };
}


export default function Page() {
  const {
    currency,
    setCurrency,
    convertPrice,
    toggleTheme,
    darkMode,
    yearly,
    setYearly,
  } = useHelper();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pricingPlans, setPricingPlans] = useState([]);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [contactForm, setContactForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    subject: '',
    message: '',
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadPricingPlans = async () => {
      try {
        const plans = await apiClient.admin.getSubscriptions();
        const normalized = (plans || [])
          .map((plan) => {
            const packageMeta = parsePackageFeatures(plan.features);
            return {
              id: plan.id,
              planName: plan.planName || plan.plan_name,
              monthlyPrice: Number(plan.monthlyPrice || plan.monthly_price || 0),
              yearlyPrice: Number(plan.yearlyPrice || plan.yearly_price || 0),
              monthlyDiscount: Number(plan.monthlyDiscount || plan.monthly_discount || 0),
              yearlyDiscount: Number(plan.yearlyDiscount || plan.yearly_discount || 0),
              ...packageMeta,
            };
          })
          .filter((plan) => plan.planType === "individual");

        if (isMounted) {
          setPricingPlans(normalized);
        }
      } catch (err) {
        console.error("Failed to load pricing plans:", err);
      } finally {
        if (isMounted) {
          setPricingLoading(false);
        }
      }
    };

    loadPricingPlans();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_34%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] text-slate-900 transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.10),transparent_34%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 flex justify-center px-3 pt-3 sm:px-4 sm:pt-5" data-aos="fade-down" data-aos-duration="900">
        <div className="w-full max-w-7xl rounded-3xl border border-white/60 bg-white/80 px-4 py-4 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-6 dark:border-white/10 dark:bg-slate-950/70 sm:rounded-full">
          <div className="flex items-center justify-between gap-3">
            <a href="#hero" className="flex items-center gap-3">
              <div className="flex h-10 items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-600/30 dark:bg-cyan-400 dark:text-slate-950">
                    <span className="text-lg font-semibold">M</span>
                  </div>
                  <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    medX<span className="text-blue-600 dark:text-cyan-300">analysis</span>
                  </span>
                </div>
              </div>
            </a>

            <nav className="hidden items-center justify-center gap-4 pt-4 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex md:gap-8">
            <a href="#hero" className="transition hover:text-blue-600 dark:hover:text-cyan-300" data-aos="fade-down" data-aos-delay="50">
              Home
            </a>
            <a href="#how-it-works" className="transition hover:text-blue-600 dark:hover:text-cyan-300" data-aos="fade-down" data-aos-delay="100">
              How It Works
            </a>
            <a href="#services" className="transition hover:text-blue-600 dark:hover:text-cyan-300" data-aos="fade-down" data-aos-delay="150">
              Services
            </a>
            <a href="#testimonials" className="transition hover:text-blue-600 dark:hover:text-cyan-300" data-aos="fade-down" data-aos-delay="200">
              Testimonials
            </a>
            <a href="#pricing" className="transition hover:text-blue-600 dark:hover:text-cyan-300" data-aos="fade-down" data-aos-delay="250">
              Pricing
            </a>
            <a href="#faq" className="transition hover:text-blue-600 dark:hover:text-cyan-300" data-aos="fade-down" data-aos-delay="300">
              FAQ
            </a>
            <a href="#contact" className="transition hover:text-blue-600 dark:hover:text-cyan-300" data-aos="fade-down" data-aos-delay="350">
              Contact
            </a>
          </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <label className="sr-only" htmlFor="currency-select">
                Currency
              </label>
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
                <Icon
                  icon="solar:alt-arrow-down-linear"
                  width={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300"
                />
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle light and dark mode"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:scale-[1.03] hover:border-blue-500 hover:text-blue-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
              >
                {darkMode ? (
                  <Icon icon="solar:moon-linear" width={22} />
                ) : (
                  <Icon icon="solar:sun-2-linear" width={22} />
                )}
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
            <nav className="mt-4 max-h-[70vh] space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-700 md:hidden dark:border-white/10 dark:bg-slate-900 dark:text-slate-100" data-aos="fade-down" data-aos-duration="300">
              <a href="#hero" onClick={() => setMobileMenuOpen(false)} className="block rounded-xl px-3 py-2 transition hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-white/5 dark:hover:text-cyan-300">
                Home
              </a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block rounded-xl px-3 py-2 transition hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-white/5 dark:hover:text-cyan-300">
                How It Works
              </a>
              <a href="#services" onClick={() => setMobileMenuOpen(false)} className="block rounded-xl px-3 py-2 transition hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-white/5 dark:hover:text-cyan-300">
                Services
              </a>
              <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="block rounded-xl px-3 py-2 transition hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-white/5 dark:hover:text-cyan-300">
                Testimonials
              </a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block rounded-xl px-3 py-2 transition hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-white/5 dark:hover:text-cyan-300">
                Pricing
              </a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block rounded-xl px-3 py-2 transition hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-white/5 dark:hover:text-cyan-300">
                FAQ
              </a>
              <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="block rounded-xl px-3 py-2 transition hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-white/5 dark:hover:text-cyan-300">
                Contact
              </a>
            </nav>
          )}
        </div>
      </header>

      {/* Hero */}
      <section id="hero" className="mx-auto flex w-full max-w-7xl items-center px-4 pb-8 pt-10 sm:px-6 sm:pt-12 lg:min-h-[calc(100vh-112px)] lg:pt-8">
        <div className="flex w-full flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
          <div className="space-y-8 text-center lg:text-left" data-aos="fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-200">
              <span className="h-2 w-2 rounded-full bg-blue-500 dark:bg-cyan-300" />
              AI-powered medical report explanations
            </span>

            <div className="space-y-5">
              <h1 className="mx-auto max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:mx-0 lg:text-6xl dark:text-white">
                Understand your medical reports instantly with clear AI guidance.
              </h1>
              <p className="mx-auto max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8 lg:mx-0 dark:text-slate-300">
                Upload reports, convert prices in your preferred currency, and switch between light and dark mode without losing context.
              </p>
            </div>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/20 transition hover:-translate-y-0.5 dark:bg-cyan-400 dark:text-slate-950 sm:w-auto"
              >
                Try It Free
              </Link>
              <a
                href="#services"
                className="rounded-full border border-slate-300 px-8 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-600 dark:border-white/15 dark:text-slate-100 dark:hover:border-cyan-400 dark:hover:text-cyan-300 sm:w-auto"
              >
                Explore Services
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:max-w-xl lg:shrink-0" data-aos="fade-left">
            <div className="absolute inset-6 rounded-4xl bg-cyan-300/20 blur-3xl dark:bg-cyan-500/10" />
            <div className="hero-float relative overflow-hidden rounded-4xl border border-white/70 bg-white/70 p-3 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 sm:p-4 lg:p-5">
              <Image
                src="/img/hero-medx.svg"
                alt="Medx Analysis medical report illustration"
                width={640}
                height={576}
                priority
                className="h-auto w-full object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-background py-20 transition-colors duration-300 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16" data-aos="fade-up">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              How AI Explains Your Report
            </h2>
            <p className="mx-auto max-w-2xl text-gray-600 dark:text-gray-400">
              Powered by medical-grade AI trained on thousands of real-world cases.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm transition-colors duration-300 dark:bg-slate-800" data-aos="fade-up" data-aos-delay="100">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
                <Icon icon="solar:upload-linear" width={32} className="text-blue-600 dark:text-cyan-300" />
              </div>
              <h4 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">Upload Report</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Securely upload your PDF, image, or photo of any medical document.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-8 text-center shadow-sm transition-colors duration-300 dark:bg-slate-800" data-aos="fade-up" data-aos-delay="200">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
                <Icon icon="bi:cpu" width={32} className="text-blue-600 dark:text-cyan-300" />
              </div>
              <h4 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">AI Analysis</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Our AI interprets results using up-to-date medical guidelines.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-8 text-center shadow-sm transition-colors duration-300 dark:bg-slate-800" data-aos="fade-up" data-aos-delay="300">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
                <Icon icon="solar:file-text-linear" width={32} className="text-blue-600 dark:text-cyan-300" />
              </div>
              <h4 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">Plain Summary</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Get a clear, visual explanation in seconds, with no jargon.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="bg-background py-20 transition-colors duration-300 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16" data-aos="fade-up">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              What Our AI Can Explain
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center" data-aos="zoom-in">
              <div className="mb-4 h-52 w-full overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800">
                <Image
                  src="/img/lab-tests.svg"
                  alt="Lab test report preview"
                  width={1200}
                  height={800}
                  className="h-full w-full object-cover"
                />
              </div>
              <h5 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">Lab Test Results</h5>
              <p className="text-gray-600 dark:text-gray-400">Blood work, urine tests, hormone panels, and more.</p>
            </div>

            <div className="text-center" data-aos="zoom-in" data-aos-delay="100">
              <div className="mb-4 h-52 w-full overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800">
                <Image
                  src="/img/imaging-reports.svg"
                  alt="Imaging report preview"
                  width={1200}
                  height={800}
                  className="h-full w-full object-cover"
                />
              </div>
              <h5 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">Imaging Reports</h5>
              <p className="text-gray-600 dark:text-gray-400">X-rays, MRIs, CT scans, ultrasounds explained visually.</p>
            </div>

            <div className="text-center" data-aos="zoom-in" data-aos-delay="200">
              <div className="mb-4 h-52 w-full overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800">
                <Image
                  src="/img/diagnosis-summary.svg"
                  alt="Diagnosis summary preview"
                  width={1200}
                  height={800}
                  className="h-full w-full object-cover"
                />
              </div>
              <h5 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">Diagnosis Summaries</h5>
              <p className="text-gray-600 dark:text-gray-400">Conditions like diabetes, hypertension, thyroid disorders, and more.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-background py-20 transition-colors duration-300 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16" data-aos="fade-up">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Trusted by Patients
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                text: '"The AI explained my cholesterol report better than my doctor did!"',
                name: "Sarah T.",
                image: "/testimonials/sarah-t.svg",
              },
              {
                text: '"Got clarity on my MRI in under a minute. Life-changing."',
                name: "James R.",
                image: "/testimonials/james-r.svg",
              },
              {
                text: '"My mom finally understands her blood sugar results—thank you!"',
                name: "Linda M.",
                image: "/testimonials/linda-m.svg",
              },
            ].map((testimonial, index) => (
              <div
                key={testimonial.name}
                className="rounded-2xl bg-white p-6 shadow-sm transition-colors duration-300 dark:bg-slate-800"
                data-aos="fade-up"
                data-aos-delay={index * 100}
              >
                <div className="mb-4 h-16 w-16 overflow-hidden rounded-full border border-slate-200 dark:border-slate-700">
                  <Image
                    src={testimonial.image}
                    alt={`${testimonial.name} profile photo`}
                    width={320}
                    height={320}
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="mb-4 text-slate-900 dark:text-gray-300">{testimonial.text}</p>
                <strong className="text-slate-900 dark:text-white">{testimonial.name}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-background py-20 transition-colors duration-300 dark:bg-slate-900">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="mb-10 text-center" data-aos="fade-up">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
              Simple, Transparent Pricing
            </h2>

            <div className="mt-6 flex items-center justify-center gap-4">
              <span className="font-medium text-gray-600 dark:text-gray-300">Monthly</span>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={yearly}
                  onChange={() => setYearly(!yearly)}
                  className="sr-only peer"
                />
                <div className="h-7 w-14 rounded-full bg-gray-300 transition-colors duration-300 peer-checked:bg-blue-600 dark:bg-gray-600" />
                <span className="pointer-events-none absolute left-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-300 peer-checked:translate-x-7" />
              </label>
              <span className="font-medium text-gray-600 dark:text-gray-300">
                Yearly <span className="font-semibold text-green-500">(Save 20%)</span>
              </span>
            </div>
          </div>

          {pricingLoading ? (
            <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white py-16 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-400">
              Loading pricing packages...
            </div>
          ) : pricingPlans.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
              {pricingPlans.map((plan, index) => {
                const isFeatured = index === 1;
                const basePrice = yearly ? plan.yearlyPrice : plan.monthlyPrice;
                const discountPercent = yearly ? (plan.yearlyDiscount || 0) : (plan.monthlyDiscount || 0);
                const discountedPrice = basePrice - (basePrice * discountPercent / 100);
                const displayPrice = discountPercent > 0 ? discountedPrice : basePrice;
                const tags = Array.isArray(plan.tags) ? plan.tags : [];
                const features = Array.isArray(plan.details) ? plan.details : [];

                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-slate-800 ${isFeatured ? "border-2 border-blue-600 shadow-lg" : ""}`}
                    data-aos="fade-up"
                    data-aos-delay={index * 100}
                  >
                    {discountPercent > 0 && (
                      <div className="absolute -top-3 right-6 flex items-center gap-1 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
                        <Icon icon="solar:fire-linear" width={14} />
                        {discountPercent}% OFF
                      </div>
                    )}

                    <h4 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">{plan.planName}</h4>
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-cyan-300">{plan.planType}</p>

                    <div className="mb-2 flex items-baseline justify-center gap-2">
                      <div className="text-4xl font-bold text-blue-600 dark:text-cyan-300">
                        {convertPrice(displayPrice)}
                      </div>
                      {discountPercent > 0 && (
                        <div className="text-sm font-semibold text-slate-400 line-through">
                          {convertPrice(basePrice)}
                        </div>
                      )}
                    </div>

                    <p className="mb-6 text-gray-600 dark:text-gray-400">{yearly ? "Per Year" : "Per Month"}</p>

                    {tags.length > 0 && (
                      <div className="mb-5 flex flex-wrap justify-center gap-2">
                        {tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <ul className="mb-8 space-y-3 text-left">
                      {features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                          <Icon icon="solar:check-circle-linear" width={20} className="shrink-0 text-green-500" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <a
                      href="/auth/signup"
                      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-2 ${isFeatured ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300" : "border-2 border-blue-600 text-blue-600 transition-all hover:bg-blue-600 hover:text-white dark:border-cyan-300 dark:text-cyan-300 dark:hover:bg-cyan-300 dark:hover:text-slate-950"}`}
                    >
                      Get Started
                      <Icon icon="solar:arrow-right-linear" width={18} />
                    </a>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-slate-800" data-aos="fade-up">
                <h4 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">Free</h4>

                <div className="mb-2 text-4xl font-bold text-blue-600 dark:text-cyan-300">{convertPrice(0)}</div>
                <p className="mb-6 text-gray-600 dark:text-gray-400">Forever Free</p>

                <ul className="mb-8 space-y-3 text-left">
                  {[
                    "AI Interpretation",
                    "Email Report Delivery",
                    "Limited PDF Download",
                    "Limited Language Translation",
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                      <Icon icon="solar:check-circle-linear" width={20} className="shrink-0 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="/auth/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-blue-600 px-6 py-2 text-blue-600 transition-all hover:bg-blue-600 hover:text-white dark:border-cyan-300 dark:text-cyan-300 dark:hover:bg-cyan-300 dark:hover:text-slate-950"
                >
                  Get Started
                  <Icon icon="solar:arrow-right-linear" width={18} />
                </a>
              </div>

              <div className="relative rounded-2xl border-2 border-blue-600 bg-white p-8 text-center shadow-lg dark:bg-slate-800" data-aos="fade-up" data-aos-delay="100">
                {yearly && (
                  <div className="absolute -top-3 right-6 flex items-center gap-1 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
                    <Icon icon="solar:fire-linear" width={14} />
                    20% OFF
                  </div>
                )}

                <h4 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">Basic</h4>

                <div className="price mb-2 text-4xl font-bold text-blue-600 dark:text-cyan-300">
                  {convertPrice(yearly ? 182 : 19)}
                </div>

                <p className="mb-6 text-gray-600 dark:text-gray-400">{yearly ? "Per Year" : "Per Month"}</p>

                <ul className="mb-8 space-y-3 text-left">
                  {[
                    "Everything in Free",
                    "AI + Doctor Interpretation",
                    "Email Report Delivery",
                    "Limited WhatsApp Report",
                    "Extended Language Translation",
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                      <Icon icon="solar:check-circle-linear" width={20} className="shrink-0 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="/auth/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-2 text-white transition-all hover:bg-blue-700 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
                >
                  Get Started
                  <Icon icon="solar:arrow-right-linear" width={18} />
                </a>
                <small className="mt-2 block text-xs text-slate-500 dark:text-slate-400">(*Terms apply)</small>
              </div>

              <div className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-slate-800" data-aos="fade-up" data-aos-delay="200">
                <h4 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">Premium</h4>

                <div className="price mb-2 text-4xl font-bold text-blue-600 dark:text-cyan-300">
                  {convertPrice(yearly ? 374 : 39)}
                </div>

                <p className="mb-6 text-gray-600 dark:text-gray-400">{yearly ? "Per Year" : "Per Month"}</p>

                <ul className="mb-8 space-y-3 text-left">
                  {[
                    "Everything in Basic",
                    "AI + Doctor Interpretation",
                    "Unlimited Email Report Delivery",
                    "Unlimited WhatsApp Report",
                    "Unlimited Language Translation",
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                      <Icon icon="solar:check-circle-linear" width={20} className="shrink-0 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="/auth/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-blue-600 px-6 py-2 text-blue-600 transition-all hover:bg-blue-600 hover:text-white dark:border-cyan-300 dark:text-cyan-300 dark:hover:bg-cyan-300 dark:hover:text-slate-950"
                >
                  Get Started
                  <Icon icon="solar:arrow-right-linear" width={18} />
                </a>
                <small className="mt-2 block text-xs text-slate-500 dark:text-slate-400">(*Terms apply)</small>
              </div>
            </div>
          )}
        </div>
      </section>


      {/* FAQ */}
      <section id="faq" className="py-20 transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16" data-aos="fade-up">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="mx-auto mb-20 max-w-5xl">
            <div className="faq-list space-y-4">
              <details className="faq-item rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6" data-aos="fade-up">
                <summary className="faq-question flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
                  <span>How does Medx Analysis interpret my medical reports?</span>
                  <span className="faq-toggle text-2xl font-light leading-none text-blue-600 dark:text-cyan-300">+</span>
                </summary>
                <div className="faq-answer mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-[15px]">
                  Our AI analyzes your uploaded report using medical guidelines from trusted sources like WHO, CDC, and peer-reviewed journals. It then generates a plain-language summary with visual indicators for abnormal values.
                </div>
              </details>

              <details className="faq-item rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6" data-aos="fade-up" data-aos-delay="100">
                <summary className="faq-question flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
                  <span>Is my data secure?</span>
                  <span className="faq-toggle text-2xl font-light leading-none text-blue-600 dark:text-cyan-300">+</span>
                </summary>
                <div className="faq-answer mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-[15px]">
                  Yes. All reports are encrypted in transit and at rest. We never share your data with third parties, and you can delete your history anytime.
                </div>
              </details>

              <details className="faq-item rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6" data-aos="fade-up" data-aos-delay="200">
                <summary className="faq-question flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
                  <span>What types of reports do you support?</span>
                  <span className="faq-toggle text-2xl font-light leading-none text-blue-600 dark:text-cyan-300">+</span>
                </summary>
                <div className="faq-answer mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-[15px]">
                  We support lab tests (blood, urine), imaging reports (X-ray, MRI, CT), pathology results, and diagnostic summaries such as diabetes or thyroid reports.
                </div>
              </details>

              <details className="faq-item rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6" data-aos="fade-up" data-aos-delay="300">
                <summary className="faq-question flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
                  <span>Do you replace my doctor?</span>
                  <span className="faq-toggle text-2xl font-light leading-none text-blue-600 dark:text-cyan-300">+</span>
                </summary>
                <div className="faq-answer mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-[15px]">
                  No. Medx Analysis is for informational purposes only and does not provide medical advice, diagnosis, or treatment. Always consult your physician.
                </div>
              </details>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6">
        <div className="mb-10 text-center" data-aos="fade-up">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-600 dark:text-cyan-300">
            Contact
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
            Get in touch with Medx Analysis
          </h2>
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
                <p className="text-sm text-slate-600 dark:text-slate-300">Send a message and we&apos;ll get back to you.</p>
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
                  <label htmlFor="home-first-name" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    First Name
                  </label>
                  <input
                    id="home-first-name"
                    type="text"
                    placeholder="John"
                    value={contactForm.firstName}
                    onChange={(e) => setContactForm({...contactForm, firstName: e.target.value})}
                    required
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-transparent px-4 text-sm outline-none transition focus:border-blue-500 dark:border-white/10 dark:focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="home-last-name" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Last Name
                  </label>
                  <input
                    id="home-last-name"
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
                <label htmlFor="home-email" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Email Address
                </label>
                <input
                  id="home-email"
                  type="email"
                  placeholder="john@example.com"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                  required
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-transparent px-4 text-sm outline-none transition focus:border-blue-500 dark:border-white/10 dark:focus:border-cyan-400"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="home-subject" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Subject
                </label>
                <input
                  id="home-subject"
                  type="text"
                  placeholder="How does the service work?"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                  required
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-transparent px-4 text-sm outline-none transition focus:border-blue-500 dark:border-white/10 dark:focus:border-cyan-400"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="home-message" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Your Message
                </label>
                <textarea
                  id="home-message"
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
        </div>
      </section>

      {/* Footer */}
      <footer
        id="footer"
        className="border-t border-slate-200/70 bg-white/60 pt-16 pb-8 transition-colors duration-300 dark:border-slate-700 dark:bg-slate-950/50"
      >
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
              <Link href="/" className="text-gray-600 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-cyan-300">
                Home
              </Link>
              <Link href="/pages/about-us" className="text-gray-600 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-cyan-300">
                About Us
              </Link>
              <Link href="/pages/contact" className="text-gray-600 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-cyan-300">
                Contact
              </Link>
              <Link href="/pages/privacy-policy" className="text-gray-600 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-cyan-300">
                Privacy Policy
              </Link>
              <Link href="/pages/term-and-conditions" className="text-gray-600 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-cyan-300">
                Term & Conditions
              </Link>
            </div>
          </div>

          <div>
            <h5 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Newsletter</h5>
            <p className="text-gray-600 dark:text-gray-400">Get health tips and AI insights monthly.</p>
            <form className="mt-4 flex flex-col gap-2 sm:flex-row">
              <div className="w-full sm:w-auto">
                <label className="sr-only" htmlFor="newsletter-email">
                  Your Email
                </label>
                <input
                  type="email"
                  id="newsletter-email"
                  name="newsletter_email"
                  className="h-12 w-full rounded-full border border-slate-200 bg-transparent px-4 text-sm outline-none transition focus:border-blue-500 dark:border-white/10 dark:focus:border-cyan-400"
                  placeholder="Your Email"
                  required
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-12 min-w-30 items-center justify-center gap-2 rounded-full bg-blue-600 px-5 text-white transition hover:bg-blue-700 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
              >
                Subscribe
                <Icon icon="prime:send" width={18} />
              </button>
            </form>
          </div>
        </div>

        <div className="mx-auto mt-10 flex w-full max-w-7xl justify-center px-4 sm:px-6">
          <div className="flex space-x-4">
            <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-700 transition-all hover:bg-blue-600 hover:text-white dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-cyan-400 dark:hover:text-slate-950">
              <Icon icon="mdi:facebook" width={20} />
            </a>
            <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-700 transition-all hover:bg-blue-600 hover:text-white dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-cyan-400 dark:hover:text-slate-950">
              <Icon icon="prime:twitter" width={20} />
            </a>
            <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-700 transition-all hover:bg-blue-600 hover:text-white dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-cyan-400 dark:hover:text-slate-950">
              <Icon icon="mdi:linkedin" width={20} />
            </a>
            <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-700 transition-all hover:bg-blue-600 hover:text-white dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-cyan-400 dark:hover:text-slate-950">
              <Icon icon="mdi:instagram" width={20} />
            </a>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-7xl border-t border-gray-300 px-4 pt-6 text-center dark:border-slate-700 sm:px-6">
          <span className="text-gray-600 dark:text-gray-400">
            Copyright © <span id="year">2024</span>{" "}
            <a href="#hero" className="text-blue-600 hover:underline dark:text-cyan-300">
              Medx Analysis.
            </a>{" "}
            AI-powered medical insights.
          </span>
        </div>
      </footer>
    </main>
  );
}
