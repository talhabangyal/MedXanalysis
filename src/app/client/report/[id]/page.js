"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { apiClient } from "@/lib/api-client";

const LANGUAGE_OPTIONS = ["English", "Urdu", "Spanish", "Arabic", "French", "German"];

function severityClass(severity) {
  const s = String(severity || "").toLowerCase();
  if (s.includes("critical")) return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300";
  if (s.includes("high")) return "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300";
  if (s.includes("moderate")) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300";
  if (s.includes("low")) return "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300";
  return "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300";
}

function normalizeAnalysis(raw) {
  if (!raw) {
    return { summary: "No analysis available.", key_findings: [], deficiencies: [], recommendations: [], severity: "unknown" };
  }

  let parsed = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      // If direct parse fails, try to extract JSON from the string
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      if (start !== -1 && end !== -1 && end > start) {
        try {
          parsed = JSON.parse(raw.substring(start, end + 1));
        } catch {
          parsed = { summary: String(raw), key_findings: [], deficiencies: [], recommendations: [], severity: "unknown" };
        }
      } else {
        parsed = { summary: String(raw), key_findings: [], deficiencies: [], recommendations: [], severity: "unknown" };
      }
    }
  }

  // Handle double-stringified JSON
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {}
  }

  // If parsed is an object but the summary field accidentally captured the raw JSON (fallback case)
  if (parsed && typeof parsed.summary === "string" && parsed.summary.includes('{"summary"')) {
    try {
      const match = parsed.summary.match(/\{[\s\S]*\}/);
      if (match) {
        const inner = JSON.parse(match[0]);
        if (inner.summary) {
          // If the fallback added a paragraph at the end, keep it in summary
          const paragraph = parsed.summary.substring(match[0].length).trim();
          if (paragraph) inner.summary = `${inner.summary}\n\n${paragraph}`;
          return inner;
        }
      }
    } catch {}
  }

  return parsed;
}

function buildSpeechText(analysis) {
  const keyFindings = (analysis?.key_findings || [])
    .map((f) => (typeof f === "string" ? f : `${f.heading || f.name || "Finding"}. ${f.detail || f.description || ""}`.trim()))
    .join(" ");
  const deficiencies = (analysis?.deficiencies || [])
    .map((d) => `${d.heading || d.name || "Deficiency"}. ${d.detail || d.description || ""}`.trim())
    .join(" ");
  const recommendations = (analysis?.recommendations || [])
    .map((r) => (typeof r === "string" ? r : `${r.heading || r.name || "Recommendation"}. ${r.detail || r.description || ""}`.trim()))
    .join(" ");

  return [
    `Summary. ${analysis?.summary || "No summary."}`,
    keyFindings ? `Key findings. ${keyFindings}` : "",
    deficiencies ? `Deficiencies. ${deficiencies}` : "",
    recommendations ? `Recommendations. ${recommendations}` : "",
    analysis?.severity ? `Severity. ${analysis.severity}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export default function ReportDetailsPage({ params }) {
  const reportId = params?.id;
  const [user, setUser] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [translatedAnalysis, setTranslatedAnalysis] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState("");

  useEffect(() => {
    const fromStorage = typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "null")
      : null;
    queueMicrotask(() => {
      setUser(fromStorage);
    });
  }, []);

  useEffect(() => {
    const loadReport = async () => {
      if (!user?.id || !reportId) return;
      setLoading(true);
      try {
        const data = await apiClient.client.getReportById(reportId, user.id);
        setReport(data);
        const initialLanguage = data?.language || "English";
        setSelectedLanguage(initialLanguage);

        if (initialLanguage !== "English") {
          const raw = normalizeAnalysis(data?.analyzedReport || data?.analyzed_report);
          const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ analysis: raw, language: initialLanguage }),
          });
          const result = await res.json();
          if (res.ok) {
            setTranslatedAnalysis(result.data || null);
          }
        }
      } catch (err) {
        console.error("Failed to load report:", err);
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [user?.id, reportId]);

  const baseAnalysis = useMemo(() => normalizeAnalysis(report?.analyzedReport || report?.analyzed_report), [report]);
  const displayAnalysis = translatedAnalysis || baseAnalysis;

  const translateTo = async (language) => {
    setSelectedLanguage(language);
    setAudioUrl("");
    setAudioError("");

    if (language === "English") {
      setTranslatedAnalysis(null);
      return;
    }

    try {
      setTranslating(true);
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis: baseAnalysis, language }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Translation failed");
      setTranslatedAnalysis(result.data || null);
    } catch (err) {
      console.error("Translation failed:", err);
      setAudioError(err?.message || "Translation failed");
      setTranslatedAnalysis(null);
    } finally {
      setTranslating(false);
    }
  };

  const generateAudio = async () => {
    try {
      setAudioLoading(true);
      setAudioError("");
      const text = buildSpeechText(displayAnalysis);
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: selectedLanguage }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Audio generation failed");
      setAudioUrl(result?.data?.audioUrl || "");
    } catch (err) {
      console.error("Audio generation failed:", err);
      setAudioError(err?.message || "Failed to generate audio");
      setAudioUrl("");
    } finally {
      setAudioLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="space-y-4">
        <Icon icon="eos-icons:loading" width={32} className="text-blue-600 dark:text-cyan-400" />
      </section>
    );
  }

  if (!report) {
    return (
      <section className="space-y-4">
        <Link href="/client/report" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline">
          <Icon icon="solar:arrow-left-linear" width={16} /> Back to reports
        </Link>
        <p className="text-sm text-rose-600">Report not found or access denied.</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/client/report" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline">
            <Icon icon="solar:arrow-left-linear" width={16} /> Back to reports
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Report Details</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-300">Report #{String(report.id).slice(0, 8).toUpperCase()}</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedLanguage}
            onChange={(e) => translateTo(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            disabled={translating}
          >
            {LANGUAGE_OPTIONS.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={generateAudio}
            disabled={audioLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-blue-400 hover:text-blue-600 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <Icon icon={audioLoading ? "eos-icons:loading" : "solar:volume-loud-linear"} width={18} />
            Get Voice
          </button>
        </div>
      </div>

      {translating && (
        <div className="inline-flex items-center gap-2 text-sm text-slate-500">
          <Icon icon="eos-icons:loading" width={16} /> Translating...
        </div>
      )}

      {audioError && <p className="text-sm text-rose-600">{audioError}</p>}
      {audioUrl && <audio controls src={audioUrl} className="w-full" />}

      <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950/70">
        <section className="border-l-4 border-blue-400 pl-4">
          <h2 className="mb-2 text-lg font-bold">Summary</h2>
          <p className="rounded-lg bg-blue-50 p-4 text-sm dark:bg-slate-800">{displayAnalysis?.summary || "No summary available."}</p>
        </section>

        {Array.isArray(displayAnalysis?.key_findings) && displayAnalysis.key_findings.length > 0 && (
          <section className="border-l-4 border-green-400 pl-4">
            <h2 className="mb-2 text-lg font-bold">Key Findings</h2>
            <div className="space-y-2">
              {displayAnalysis.key_findings.map((finding, idx) => {
                const heading = finding?.heading || finding?.name || finding;
                const detail = finding?.detail || finding?.description || "";
                return (
                  <div key={idx} className="rounded-lg bg-green-50 p-4 dark:bg-green-900/10">
                    <h3 className="font-semibold text-green-900 dark:text-green-200">{heading}</h3>
                    {detail ? <p className="mt-1 text-sm text-green-800 dark:text-green-100">{detail}</p> : null}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {Array.isArray(displayAnalysis?.deficiencies) && displayAnalysis.deficiencies.length > 0 && (
          <section className="border-l-4 border-orange-400 pl-4">
            <h2 className="mb-2 text-lg font-bold">Deficiencies</h2>
            <div className="space-y-2">
              {displayAnalysis.deficiencies.map((item, idx) => (
                <div key={idx} className="rounded-lg bg-orange-50 p-4 dark:bg-orange-900/10">
                  <h3 className="font-semibold text-orange-900 dark:text-orange-200">{item?.heading || item?.name || `Deficiency ${idx + 1}`}</h3>
                  <p className="mt-1 text-sm text-orange-800 dark:text-orange-100">{item?.detail || item?.description || "No details provided."}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {Array.isArray(displayAnalysis?.recommendations) && displayAnalysis.recommendations.length > 0 && (
          <section className="border-l-4 border-emerald-400 pl-4">
            <h2 className="mb-2 text-lg font-bold">Recommendations</h2>
            <div className="space-y-2">
              {displayAnalysis.recommendations.map((item, idx) => {
                const heading = item?.heading || item?.name || item;
                const detail = item?.detail || item?.description || "";
                return (
                  <div key={idx} className="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-900/10">
                    <h3 className="font-semibold text-emerald-900 dark:text-emerald-200">{heading}</h3>
                    {detail ? <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-100">{detail}</p> : null}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="border-l-4 border-red-400 pl-4">
          <h2 className="mb-2 text-lg font-bold">Severity</h2>
          <span className={`inline-flex rounded-full px-4 py-2 text-sm font-bold uppercase tracking-wider ${severityClass(displayAnalysis?.severity)}`}>
            {displayAnalysis?.severity || "unknown"}
          </span>
        </section>
      </div>
    </section>
  );
}
