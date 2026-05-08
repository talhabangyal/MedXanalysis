"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { getAuthEndpoint } from "@/lib/auth-endpoints";
import ThemeToggle from "@/components/theme-toggle";
import ThemeProvider from "@/components/theme-provider";

const RESEND_DELAY_SECONDS = 60;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState(""); // Renamed from email to identifier to support both
  const [code, setCode] = useState(Array.from({ length: 6 }, () => ""));
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  const resetMessages = () => {
    setStatusMessage("");
    setErrorMessage("");
  };

  const codeValue = code.join("");

  useEffect(() => {
    if (step !== 2 || resendSeconds === 0) {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setResendSeconds((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [step, resendSeconds]);

  const startResendCountdown = () => {
    setResendSeconds(RESEND_DELAY_SECONDS);
  };

  const focusFirstCodeInput = () => {
    const firstInput = document.getElementById("code-0");
    if (firstInput) {
      firstInput.focus();
    }
  };

  useEffect(() => {
    if (step !== 2) {
      return undefined;
    }

    const focusTimer = window.setTimeout(() => {
      focusFirstCodeInput();
    }, 0);

    return () => window.clearTimeout(focusTimer);
  }, [step]);

  const requestResetCode = async () => {
    const res = await fetch(getAuthEndpoint('/auth/forgot-password'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Unable to send reset code');
    }

    return res;
  };

  const handleRequestCode = async (event) => {
    event.preventDefault();
    resetMessages();

    if (!identifier.trim()) {
      setErrorMessage("Please enter your username or email address.");
      return;
    }

    setIsLoading(true);
    try {
      await requestResetCode();

      setStatusMessage('If an account exists, a 6-character reset code was sent.');
      setCode(Array.from({ length: 6 }, () => ""));
      setStep(2);
      startResendCountdown();
    } catch (err) {
      console.error('Reset password error:', err);
      setErrorMessage('Unable to send reset code right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (index, value) => {
    const nextValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 1);
    setCode((prev) => {
      const updated = [...prev];
      updated[index] = nextValue;
      return updated;
    });

    if (nextValue && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerifyCode = async (event) => {
    event.preventDefault();
    resetMessages();

    if (codeValue.length !== 6) {
      setErrorMessage("Please enter all 6 code characters.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(getAuthEndpoint('/auth/verify-reset-code'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, code: codeValue }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Invalid or expired code');
      }

      setStep(3);
      setStatusMessage('Code verified. Set your new password below.');
    } catch (err) {
      console.error('Verify reset code error:', err);
      setErrorMessage(err.message || 'Unable to verify reset code right now.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (isLoading || resendSeconds > 0) {
      return;
    }

    resetMessages();
    setIsLoading(true);
    try {
      await requestResetCode();
      setCode(Array.from({ length: 6 }, () => ""));
      setStatusMessage('A new reset code was sent.');
      startResendCountdown();
      focusFirstCodeInput();
    } catch (err) {
      console.error('Resend reset code error:', err);
      setErrorMessage('Unable to resend the code right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    resetMessages();

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(getAuthEndpoint('/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, code: codeValue, password }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Reset failed');
      }

      setStatusMessage('Password reset successful. Redirecting to login...');
      setTimeout(() => {
        router.push('/auth/login');
      }, 1200);
    } catch (err) {
      console.error('Reset error:', err);
      setErrorMessage(err.message || 'Unable to reset password right now.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemeProvider>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_35%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] px-4 py-8 text-slate-900 transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.10),transparent_35%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] dark:text-slate-100 sm:px-6 lg:px-8">
        <ThemeToggle />
        <div className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-6xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-4xl border border-white/70 bg-white/80 shadow-[0_20px_80px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
          <div className="p-6 sm:p-10 lg:p-12">
            <div className="mx-auto max-w-lg text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-cyan-500/10 dark:text-cyan-300">
                <Icon icon={step === 1 ? "solar:lock-password-linear" : "solar:shield-keyhole-linear"} width={28} />
              </div>

              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-600 dark:text-cyan-300">
                {step === 1 ? "Reset access" : step === 2 ? "Verify code" : "Set password"}
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                {step === 1 ? "Forgot your password?" : step === 2 ? "Enter your recovery code" : "Create a new password"}
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {step === 1
                  ? "Enter your username or email and we will send you a 6-character recovery code."
                  : step === 2
                    ? "Type the 6-character code from your email to continue."
                    : "Set your new password and confirm it below."}
              </p>

              {step === 1 && (
                <form
                  className="mt-8 space-y-5 text-left"
                  onSubmit={handleRequestCode}
                >
                  <div className="space-y-2">
                    <label htmlFor="reset-identifier" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Username or Email
                    </label>
                    <div className="relative">
                      <Icon icon="solar:user-linear" width={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="reset-identifier"
                        type="text"
                        placeholder="username or you@example.com"
                        value={identifier}
                        onChange={(event) => setIdentifier(event.target.value)}
                        disabled={isLoading}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-transparent pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 dark:border-white/10 dark:focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-6 text-sm font-semibold text-white transition hover:-translate-y-0.5 dark:bg-cyan-400 dark:text-slate-950"
                  >
                    <Icon icon="solar:mailbox-linear" width={18} />
                    {isLoading ? "Sending..." : "Send Code"}
                  </button>
                </form>
              )}

              {step === 2 && (
                <form
                  className="mt-8 space-y-6 text-left"
                  onSubmit={handleVerifyCode}
                >
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Verification Code
                    </label>
                    <div className="grid grid-cols-6 gap-3 sm:gap-4">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <input
                          key={index}
                          id={`code-${index}`}
                          type="text"
                          maxLength={1}
                          inputMode="text"
                          value={code[index]}
                          onChange={(event) => handleCodeChange(index, event.target.value)}
                          onKeyDown={(event) => handleKeyDown(index, event)}
                          disabled={isLoading}
                          aria-label={`Code character ${index + 1}`}
                          className="h-14 rounded-2xl border border-slate-200 bg-transparent text-center text-lg font-semibold uppercase outline-none transition focus:border-blue-500 dark:border-white/10 dark:focus:border-cyan-400"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <span>{resendSeconds > 0 ? `Resend available in ${resendSeconds}s` : 'Need a new code?'}</span>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={isLoading || resendSeconds > 0}
                      className="font-semibold text-blue-600 transition hover:underline disabled:cursor-not-allowed disabled:opacity-50 dark:text-cyan-300"
                    >
                      {resendSeconds > 0 ? 'Resend code' : 'Send again'}
                    </button>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      disabled={isLoading}
                      className="inline-flex h-12 flex-1 items-center justify-center rounded-full border border-slate-200 px-6 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-600 dark:border-white/10 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-slate-950 px-6 text-sm font-semibold text-white transition hover:-translate-y-0.5 dark:bg-cyan-400 dark:text-slate-950"
                    >
                      <Icon icon="solar:arrow-right-linear" width={18} />
                      {isLoading ? "Verifying..." : "Verify Code"}
                    </button>
                  </div>
                </form>
              )}

              {step === 3 && (
                <form className="mt-8 space-y-6 text-left" onSubmit={handleResetPassword}>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <label htmlFor="new-password" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        New Password
                      </label>
                      <div className="relative">
                        <Icon icon="solar:lock-password-linear" width={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          id="new-password"
                          type="password"
                          placeholder="Enter a new password"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          disabled={isLoading}
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-transparent pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 dark:border-white/10 dark:focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <label htmlFor="confirm-new-password" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Icon icon="solar:shield-keyhole-linear" width={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          id="confirm-new-password"
                          type="password"
                          placeholder="Confirm your new password"
                          value={confirmPassword}
                          onChange={(event) => setConfirmPassword(event.target.value)}
                          disabled={isLoading}
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-transparent pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 dark:border-white/10 dark:focus:border-cyan-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={isLoading}
                      className="inline-flex h-12 flex-1 items-center justify-center rounded-full border border-slate-200 px-6 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-600 dark:border-white/10 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-slate-950 px-6 text-sm font-semibold text-white transition hover:-translate-y-0.5 dark:bg-cyan-400 dark:text-slate-950"
                    >
                      <Icon icon="solar:refresh-linear" width={18} />
                      {isLoading ? "Resetting..." : "Reset Password"}
                    </button>
                  </div>
                </form>
              )}

              {(statusMessage || errorMessage) && (
                <p className={`mt-5 text-sm ${errorMessage ? "text-rose-600 dark:text-rose-300" : "text-emerald-700 dark:text-emerald-300"}`}>
                  {errorMessage || statusMessage}
                </p>
              )}

              <p className="mt-6 text-sm text-slate-600 dark:text-slate-300">
                Remember your password?{" "}
                <Link href="/auth/login" className="font-semibold text-blue-600 hover:underline dark:text-cyan-300">
                  Back to login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      </main>
    </ThemeProvider>
  );
}