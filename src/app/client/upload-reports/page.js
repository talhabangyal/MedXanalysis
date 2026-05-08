"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { apiClient } from "@/lib/api-client";

const LANGUAGE_OPTIONS = ["English", "Urdu", "Spanish", "Arabic", "French", "German"];

export default function ClientUploadReportsPage() {
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [language, setLanguage] = useState("English");
  const [optionsActive, setOptionsActive] = useState(false);
  const [, setSubmitted] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(true);
  const [doctorAnalysis] = useState(false);
  const [whatsappDelivery] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const buildReportBaseName = () => {
    const username = (user?.username || user?.email?.split('@')?.[0] || 'user').toLowerCase();
    const role = (user?.role || 'client').toLowerCase();
    const hashCode = String(Math.floor(100000 + Math.random() * 900000));

    return `${username}_${role}_${hashCode}`;
  };

  useEffect(() => {
    const fromStorage = typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "null")
      : null;
    // defer setState to avoid synchronous setState-in-effect
    setTimeout(() => setUser(fromStorage), 0);
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setOptionsActive(false);
      setSubmitted(false);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    setOptionsActive(true);
    setSubmitted(false);
  };

  const handleSubmit = async () => {
    if (!selectedFile || !optionsActive || !user) return;
    setLoading(true);

    try {
      // 1. Upload file to public/report
      const filenameBase = buildReportBaseName();
      const uploadResult = await apiClient.uploadReport(selectedFile, filenameBase);
      const reportPath = uploadResult?.path || '/report/default.pdf';

      // 2. Create main report record with "submitted" status
      const reportRes = await fetch('/api/client?operation=report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          report_status: 'submitted',
          upload_date: new Date().toISOString(),
        }),
      });

      if (!reportRes.ok) throw new Error('Failed to create report');
      const reportData = await reportRes.json();
      const reportId = reportData.data?.id;

      if (!reportId) throw new Error('No report ID returned');

      // 3. Create uploaded report record with all options
      const uploadedRes = await fetch('/api/client?operation=uploaded-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_id: reportId,
          report_url: reportPath,
          report_type: selectedFile.type,
          analyzed_by_ai: aiAnalysis,
          checked_by_doctor: doctorAnalysis,
          language: language,
          send_to_whatsapp: whatsappDelivery,
        }),
      });

      if (!uploadedRes.ok) throw new Error('Failed to save upload details');

      // 4. Log activity
      await apiClient.client.createActivity({
        user_id: user.id,
        action: 'upload_report',
        description: `Uploaded report: ${selectedFile.name}`,
        source: 'client',
      });

      setSubmitted(true);
      showNotification('Report submitted successfully! You can view it in the Reports section.', 'success');
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setSelectedFile(null);
        setOptionsActive(false);
        setSubmitted(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }, 2000);
    } catch (err) {
      console.error('Upload failed:', err);
      showNotification('Failed to submit report. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upload Reports</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Upload a report and choose how you want it analyzed.</p>
      </div>

      <div className="overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-[0_18px_70px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950/70">
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_35%),linear-gradient(180deg,#f8fbff_0%,#edf4ff_100%)] p-6 sm:p-8 dark:bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_35%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]">
            <div className="absolute -right-12 top-10 h-36 w-36 rounded-full bg-blue-500/10 blur-3xl dark:bg-cyan-400/10" />
            <div className="absolute -bottom-16 left-16 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl" />

            <div className="relative space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-4 py-2 text-sm font-semibold text-blue-700 backdrop-blur dark:border-cyan-500/20 dark:bg-slate-950/50 dark:text-cyan-200">
                <Icon icon="solar:cloud-upload-linear" width={18} />
                Secure report upload
              </div>

              <div className="space-y-3">
                <h2 className="max-w-2xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl dark:text-white">
                  Upload your medical report and prepare it for AI review.
                </h2>
                <p className="max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Select a file, click upload, then choose analysis preferences from the right panel and submit.
                </p>
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={openFilePicker}
                onKeyDown={(event) => event.key === "Enter" && openFilePicker()}
                className="group flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-[1.75rem] border-2 border-dashed border-blue-200 bg-white/80 p-6 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:bg-white dark:border-white/10 dark:bg-slate-900/70 dark:hover:border-cyan-400"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600 shadow-inner transition group-hover:scale-105 dark:bg-cyan-500/10 dark:text-cyan-300">
                  <Icon icon="solar:upload-linear" width={34} />
                </div>

                <div className="mt-5 space-y-2">
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">Drag and drop your report here</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Images, PDF, and Word documents are supported.</p>
                </div>

                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  <Icon icon="solar:folder-with-files-linear" width={18} />
                  {selectedFile ? "Change file" : "Choose file"}
                </div>

                <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.doc,.docx" onChange={handleFileChange} className="hidden" />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={!selectedFile || loading}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-300 dark:bg-cyan-400 dark:text-slate-950 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
                >
                  <Icon icon="solar:cloud-check-linear" width={18} />
                  {optionsActive ? "File Ready" : "Proceed to Options"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setOptionsActive(false);
                    setSubmitted(false);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
                >
                  <Icon icon="solar:trash-bin-minimalistic-linear" width={18} />
                  Clear
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 p-6 sm:p-8 lg:border-l lg:border-t-0 dark:border-slate-800">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Selected File</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {selectedFile ? selectedFile.name : "No file selected yet."}
                </p>
              </div>

              {!optionsActive && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                  Select a file and click proceed. This panel will become active for preference selection.
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white dark:bg-cyan-400 dark:text-slate-950">
                    <Icon icon="solar:file-text-linear" width={22} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Report Summary</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Ready for analysis once submitted.</p>
                  </div>
                </div>
              </div>

              <div className={`space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-950 ${
                optionsActive ? "opacity-100" : "pointer-events-none opacity-50"
              }`}>
                <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Quick Preferences</h4>

                <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={aiAnalysis}
                    onChange={(event) => setAiAnalysis(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600"
                  />
                  <span>
                    <span className="block font-semibold text-slate-900 dark:text-white">AI report analysis</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">Generate an AI-based explanation of the uploaded report.</span>
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  <input type="checkbox" checked={doctorAnalysis} onChange={(e) => setDoctorAnalysis(e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600" />
                  <span>
                    <span className="block font-semibold text-slate-900 dark:text-white">Doctor report analysis</span>
                    <span className="block text-xs">Request a manual review from a certified professional.</span>
                  </span>
                </label>

                <div className="space-y-2">
                  <label htmlFor="language" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Select language
                  </label>
                  <select
                    id="language"
                    value={language}
                    onChange={(event) => setLanguage(event.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    {LANGUAGE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!optionsActive || !selectedFile || loading}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-300 dark:bg-cyan-400 dark:text-slate-950 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
                >
                  {loading ? (
                    <Icon icon="eos-icons:loading" width={18} />
                  ) : (
                    <Icon icon="solar:check-read-linear" width={18} />
                  )}
                  Submit for Analysis
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {notification && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className={`relative rounded-2xl px-8 py-8 shadow-2xl backdrop-blur-sm pointer-events-auto min-w-72 ${
            notification.type === 'success'
              ? 'bg-emerald-500/95 text-white'
              : 'bg-red-500/95 text-white'
          }`}>
            {/* Close Button */}
            <button
              onClick={() => setNotification(null)}
              className="absolute top-3 right-3 p-1 hover:opacity-80 transition"
              aria-label="Close notification"
            >
              <Icon icon="solar:close-circle-bold" width={24} />
            </button>

            {/* Content - Centered */}
            <div className="flex flex-col items-center gap-4">
              <p className="font-semibold text-center text-lg">{notification.message}</p>
              
              {/* Animated Icon */}
              <Icon 
                icon={notification.type === 'success' ? 'solar:check-circle-bold' : 'solar:close-circle-bold'} 
                width={48}
                className={notification.type === 'success' ? 'animate-bounce' : ''}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}