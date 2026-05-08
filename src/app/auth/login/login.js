"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthEndpoint } from "@/lib/auth-endpoints";
import ThemeToggle from "@/components/theme-toggle";
import ThemeProvider from "@/components/theme-provider";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!identifier.trim() || !password.trim()) {
        throw new Error("Please enter both username/email and password.");
      }

      const res = await fetch(getAuthEndpoint('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Login failed');
      }

      const data = await res.json();
      // store token and user minimally
      if (remember) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        sessionStorage.setItem('token', data.access_token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
      }

      const roleRoutes = {
        admin: '/admin/dashboard',
        client: '/client/dashboard',
        doctor: '/doctor/dashboard',
        enterprise: '/enterprise/dashboard',
      };

      const targetPath = roleRoutes[data?.user?.role] || '/client/dashboard';
      router.replace(targetPath);
      router.refresh();
      
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_35%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] px-4 py-8 text-slate-900 transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.10),transparent_35%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] dark:text-slate-100 sm:px-6 lg:px-8">
        <ThemeToggle />
        <div className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-4xl border border-white/70 bg-white/80 shadow-[0_20px_80px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 lg:grid-cols-[1fr,0.9fr]">
          <aside className="hidden flex-col justify-between bg-slate-950 p-10 text-white dark:bg-slate-900 lg:flex">
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

              <h2 className="text-4xl font-black leading-tight tracking-tight">
                Welcome back to your clinical dashboard.
              </h2>
              <p className="mt-5 text-sm leading-7 text-slate-300">
                Sign in to review analysis, manage your account, and continue where you left off.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300">
                  <Icon icon="solar:shield-check-linear" width={20} />
                </span>
                Secure access for members only
              </div>
            </div>
          </aside>

          <section className="p-6 sm:p-10 lg:p-12">
            <div className="mx-auto max-w-md">
              <div className="mb-8 text-center lg:text-left">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-600 dark:text-cyan-300">
                  Welcome back
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                  Sign in to your account
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Use your username or email and password to continue.
                </p>
              </div>

              {error && (
                <div 
                  role="alert"
                  className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="space-y-2">
                  <label htmlFor="login-identifier" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Username or Email
                  </label>
                  <div className="relative">
                    <Icon icon="solar:user-linear" width={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="login-identifier"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      disabled={loading}
                      type="text"
                      inputMode="text"
                      autoComplete="username"
                      placeholder="Username or you@example.com"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-transparent pl-11 pr-4 text-sm outline-none transition disabled:opacity-50 focus:border-blue-500 dark:border-white/10 dark:focus:border-cyan-400"
                      required
                      aria-required="true"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="login-password" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Password
                  </label>
                  <div className="relative">
                    <Icon icon="solar:lock-password-linear" width={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="login-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      type="password"
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-transparent pl-11 pr-4 text-sm outline-none transition disabled:opacity-50 focus:border-blue-500 dark:border-white/10 dark:focus:border-cyan-400"
                      required
                      aria-required="true"
                      minLength={8}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 text-sm">
                  <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      disabled={loading}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 disabled:opacity-50 focus:ring-blue-500"
                    />
                    Remember me
                  </label>
                  <Link 
                    href="/auth/forgot-password" 
                    className="font-medium text-blue-600 hover:underline dark:text-cyan-300"
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-6 text-sm font-semibold text-white transition disabled:opacity-50 hover:-translate-y-0.5 dark:bg-cyan-400 dark:text-slate-950"
                  aria-busy={loading}
                >
                  {loading ? (
                    <>
                      <Icon icon="eos-icons:loading" width={18} className="animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <Icon icon="solar:login-3-linear" width={18} />
                      Sign In
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300 lg:text-left">
                Don&apos;t have an account?{" "}
                <Link 
                  href="/auth/signup" 
                  className="font-semibold text-blue-600 hover:underline dark:text-cyan-300"
                >
                  Create one
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>
      </main>
    </ThemeProvider>
  );
}