import Link from "next/link";

export default function ClientSettingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950/70 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-600 dark:text-cyan-300">
          Coming Soon
        </p>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          Settings
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
          This section is under development. You will soon be able to manage client preferences, security, and account options here.
        </p>

        <Link
          href="/client/dashboard"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 dark:bg-cyan-400 dark:text-slate-950"
        >
          Go to Dashboard
        </Link>
      </div>
    </main>
  );
}
