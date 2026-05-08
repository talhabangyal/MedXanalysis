"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthEndpoint } from "@/lib/auth-endpoints";
import ThemeToggle from "@/components/theme-toggle";
import ThemeProvider from "@/components/theme-provider";

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Basic Validation
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters.");
      }

      if (!username.trim()) {
        throw new Error("Username is required.");
      }

      const res = await fetch(getAuthEndpoint('/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          username,
          email,
          password,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Signup failed');
      }

      router.push('/auth/login');
      
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message || "An error occurred during sign up.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_35%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] px-4 py-8 text-slate-900 transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.10),transparent_35%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] dark:text-slate-100 sm:px-6 lg:px-8">
        <ThemeToggle />
        <div className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-4xl border border-white/70 bg-white/80 shadow-[0_20px_80px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 lg:grid-cols-[0.95fr,1fr]">
          <div className="order-2 p-6 sm:p-10 lg:order-1 lg:p-12">
            <div className="mx-auto max-w-md">
              <div className="mb-8 text-center lg:text-left">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-600 dark:text-cyan-300">
                  Create account
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                  Sign up for Medx Analysis
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Create an account to save reports, track pricing, and manage your analyses.
                </p>
              </div>

              {error && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="signup-first-name" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      First Name
                    </label>
                    <input
                      id="signup-first-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={loading}
                      type="text"
                      placeholder="John"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-transparent px-4 text-sm outline-none transition disabled:opacity-50 focus:border-blue-500 dark:border-white/10 dark:focus:border-cyan-400"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="signup-last-name" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Last Name
                    </label>
                    <input
                      id="signup-last-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={loading}
                      type="text"
                      placeholder="Doe"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-transparent px-4 text-sm outline-none transition disabled:opacity-50 focus:border-blue-500 dark:border-white/10 dark:focus:border-cyan-400"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="signup-username" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Username
                  </label>
                  <div className="relative">
                    <Icon icon="solar:user-linear" width={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="signup-username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={loading}
                      type="text"
                      placeholder="johndoe"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-transparent pl-11 pr-4 text-sm outline-none transition disabled:opacity-50 focus:border-blue-500 dark:border-white/10 dark:focus:border-cyan-400"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="signup-email" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Email Address
                  </label>
                  <div className="relative">
                    <Icon icon="solar:letter-linear" width={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="signup-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      type="email"
                      placeholder="you@example.com"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-transparent pl-11 pr-4 text-sm outline-none transition disabled:opacity-50 focus:border-blue-500 dark:border-white/10 dark:focus:border-cyan-400"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="signup-password" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Password
                  </label>
                  <div className="relative">
                    <Icon icon="solar:lock-password-linear" width={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="signup-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      type="password"
                      placeholder="Create a password"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-transparent pl-11 pr-4 text-sm outline-none transition disabled:opacity-50 focus:border-blue-500 dark:border-white/10 dark:focus:border-cyan-400"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="signup-confirm-password" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Icon icon="solar:shield-keyhole-linear" width={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="signup-confirm-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      type="password"
                      placeholder="Confirm your password"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-transparent pl-11 pr-4 text-sm outline-none transition disabled:opacity-50 focus:border-blue-500 dark:border-white/10 dark:focus:border-cyan-400"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-6 text-sm font-semibold text-white transition disabled:opacity-50 hover:-translate-y-0.5 dark:bg-cyan-400 dark:text-slate-950"
                >
                  {loading ? (
                    <>
                      <Icon icon="eos-icons:loading" width={18} />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <Icon icon="solar:user-plus-linear" width={18} />
                      Create Account
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300 lg:text-left">
                Already have an account?{" "}
                <Link href="/auth/login" className="font-semibold text-blue-600 hover:underline dark:text-cyan-300">
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          <div className="hidden flex-col justify-between bg-slate-950 p-10 text-white dark:bg-slate-900 lg:flex">
            <div>
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/30">
                  <span className="text-lg font-bold">M</span>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Medx</p>
                  <h1 className="text-2xl font-black tracking-tight">Analysis</h1>
                </div>
              </div>

              <p className="text-lg leading-8 text-slate-300">
                Join Medx Analysis and start reading medical reports with clear AI guidance.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <p className="text-sm leading-7 text-slate-300">
                Save your progress. Revisit your report history. Keep everything in one secure place.
              </p>
            </div>
          </div>
        </div>
      </div>
      </main>
    </ThemeProvider>
  );
}