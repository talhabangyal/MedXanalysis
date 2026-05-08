"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { translateAnalysis } from "@/lib/translate";

const LANGUAGE_OPTIONS = ["English", "Urdu", "Spanish", "Arabic", "French", "German"];

function reportStatusClass(status) {
  const s = status?.toLowerCase();
  if (s === "reviewed" || s === "completed") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
  if (s === "pending" || s === "processing") return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
  return "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300";
}

function severityClass(severity) {
  const s = severity?.toLowerCase();
  if (s === "critical") return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300";
  if (s === "high") return "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300";
  if (s === "moderate") return "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300";
  if (s === "low") return "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300";
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

  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {}
  }

  if (parsed && typeof parsed.summary === "string" && parsed.summary.includes('{"summary"')) {
    try {
      const match = parsed.summary.match(/\{[\s\S]*\}/);
      if (match) {
        const inner = JSON.parse(match[0]);
        if (inner.summary) {
          const paragraph = parsed.summary.substring(match[0].length).trim();
          if (paragraph) inner.summary = `${inner.summary}\n\n${paragraph}`;
          return inner;
        }
      }
    } catch {}
  }

  return parsed;
}

export default function ClientReportPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingReportId, setDeletingReportId] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [translatedAnalysis, setTranslatedAnalysis] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [translating, setTranslating] = useState(false);

  const loadReports = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
        const data = await apiClient.client.getReports(user.id);
      setReports(data || []);
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const fromStorage = typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "null")
      : null;
    if (fromStorage) {
      queueMicrotask(() => {
        setUser(fromStorage);
      });
    } else {
      queueMicrotask(() => {
        setLoading(false);
      });
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      queueMicrotask(() => {
        loadReports();
      });
    }
  }, [loadReports, user]);

  const handleViewDetails = (report) => {
    router.push(`/client/report/details?id=${encodeURIComponent(report.id)}`);
  };

  const handleLanguageChange = async (language) => {
    if (!selectedReport) return;
    
    setSelectedLanguage(language);
    
    if (language === "English") {
      setTranslatedAnalysis(null);
      return;
    }

    setTranslating(true);
    try {
      const analysisText = selectedReport.analyzedReport || selectedReport.analyzed_report;
      
      if (!analysisText) {
        console.error("No analysis text found");
        setTranslating(false);
        return;
      }

      let analysis = normalizeAnalysis(analysisText);

      console.log("Translating analysis to:", language);
      const translated = await translateAnalysis(analysis, language);
      console.log("Translation complete:", translated);
      setTranslatedAnalysis(translated);
    } catch (err) {
      console.error("Translation failed:", err);
      setTranslatedAnalysis(null);
    } finally {
      setTranslating(false);
    }
  };

  const handleDeleteReport = async (report) => {
    if (!user?.id || !report?.id) return;

    const confirmed = window.confirm("Are you sure you want to delete this report?");
    if (!confirmed) return;

    try {
      setDeletingReportId(report.id);
      await apiClient.client.deleteReport(report.id, user.id);
      setReports((prev) => prev.filter((item) => item.id !== report.id));

      if (selectedReport?.id === report.id) {
        setShowModal(false);
        setSelectedReport(null);
      }
    } catch (err) {
      console.error("Failed to delete report:", err);
      window.alert(err?.message || "Failed to delete report");
    } finally {
      setDeletingReportId(null);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Your Reports</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Track and view all your submitted medical documents.</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                <th className="px-6 py-5 font-semibold">Report ID</th>
                <th className="px-6 py-5 font-semibold">Type</th>
                <th className="px-6 py-5 font-semibold">Upload Date</th>
                <th className="px-6 py-5 font-semibold">Status</th>
                <th className="px-6 py-5 font-semibold text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Icon icon="eos-icons:loading" width={32} className="mx-auto text-blue-600 dark:text-cyan-400" />
                  </td>
                </tr>
              )}
              
              {!loading && reports.map((report) => (
                <tr key={report.id} className="group text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900/50">
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">#{report.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-900 dark:text-white">Medical Report</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{(report.uploadDate || report.upload_date) ? new Date(report.uploadDate || report.upload_date).toLocaleDateString() : 'Unknown'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${reportStatusClass(report.reportStatus || report.report_status)}`}>
                      {report.reportStatus || report.report_status || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
                        onClick={() => handleViewDetails(report)}
                      >
                        <Icon icon="solar:eye-linear" width={16} />
                        View Details
                      </button>
                      <button
                        type="button"
                        aria-label="Delete report"
                        title="Delete report"
                        disabled={deletingReportId === report.id}
                        className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-white p-2 text-rose-600 transition hover:border-rose-400 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-900/40 dark:bg-slate-950 dark:text-rose-300 dark:hover:border-rose-400 dark:hover:bg-rose-900/20"
                        onClick={() => handleDeleteReport(report)}
                      >
                        <Icon
                          icon={deletingReportId === report.id ? "eos-icons:loading" : "solar:trash-bin-trash-linear"}
                          width={16}
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && reports.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                    <Icon icon="solar:file-corrupted-linear" width={48} className="mx-auto mb-3 opacity-20" />
                    No reports found. Start by uploading one!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {showModal && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative z-10 w-full max-w-3xl rounded-2xl bg-white shadow-xl dark:bg-slate-900 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-800">
              <h3 className="text-lg font-semibold">Report Analysis</h3>
              <button className="p-1" onClick={() => setShowModal(false)} aria-label="Close">
                <Icon icon="solar:close-circle-bold" width={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Language Selector */}
              <div className="mb-6 flex items-center gap-3">
                <label className="text-sm font-semibold">View in:</label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-cyan-400"
                  disabled={translating}
                >
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
                {translating && (
                  <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                    <Icon icon="eos-icons:loading" width={16} />
                    Translating...
                  </span>
                )}
              </div>

              {/* Analysis Content */}
              <div className="space-y-6">
                {(() => {
                  const analysisText = selectedReport.analyzedReport || selectedReport.analyzed_report || '';
                  let analysis = normalizeAnalysis(analysisText);

                  const displayAnalysis = translatedAnalysis || analysis;

                  return (
                    <>
                      {/* 1. Summary */}
                      {displayAnalysis.summary && (
                        <section className="border-l-4 border-blue-400 pl-4">
                          <h4 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">📋 Summary</h4>
                          <div className="rounded-lg bg-blue-50 p-4 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            {displayAnalysis.summary}
                          </div>
                        </section>
                      )}

                      {/* 2. Key Findings */}
                      {displayAnalysis.key_findings && Array.isArray(displayAnalysis.key_findings) && displayAnalysis.key_findings.length > 0 && (
                        <section className="border-l-4 border-green-400 pl-4">
                          <h4 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">✓ Key Findings</h4>
                          <ul className="space-y-3">
                            {displayAnalysis.key_findings.map((finding, idx) => {
                              // Handle both string and object formats
                              const heading = finding.heading || finding.name || finding;
                              const detail = finding.detail || finding.description || '';
                              
                              return (
                                <li key={idx} className="rounded-lg bg-green-50 p-4 dark:bg-green-900/10">
                                  <div className="flex gap-3">
                                    <Icon icon="solar:check-circle-linear" width={20} className="mt-0.5 shrink-0 text-green-600 dark:text-green-400" />
                                    <div className="flex-1">
                                      <h5 className="font-semibold text-green-900 dark:text-green-200">{heading}</h5>
                                      {detail && <p className="mt-1 text-sm text-green-800 dark:text-green-100">{detail}</p>}
                                    </div>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </section>
                      )}

                      {/* 3. Deficiencies */}
                      {displayAnalysis.deficiencies && Array.isArray(displayAnalysis.deficiencies) && displayAnalysis.deficiencies.length > 0 && (
                        <section className="border-l-4 border-orange-400 pl-4">
                          <h4 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">⚠️ Abnormalities & Deficiencies</h4>
                          <div className="space-y-3">
                            {displayAnalysis.deficiencies.map((deficiency, idx) => {
                              const heading = deficiency.heading || deficiency.name || `Deficiency ${idx + 1}`;
                              const detail = deficiency.detail || deficiency.description || '';
                              
                              return (
                                <div key={idx} className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900/30 dark:bg-orange-900/10">
                                  <h5 className="font-bold text-lg text-orange-900 dark:text-orange-200">
                                    {heading}
                                  </h5>
                                  {detail && (
                                    <p className="mt-2 text-sm text-orange-800 dark:text-orange-100">
                                      {detail}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </section>
                      )}

                      {/* 4. Recommendations */}
                      {displayAnalysis.recommendations && Array.isArray(displayAnalysis.recommendations) && displayAnalysis.recommendations.length > 0 && (
                        <section className="border-l-4 border-emerald-400 pl-4">
                          <h4 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">→ Recommendations</h4>
                          <ul className="space-y-3">
                            {displayAnalysis.recommendations.map((rec, idx) => {
                              // Handle both string and object formats
                              const heading = rec.heading || rec.name || rec;
                              const detail = rec.detail || rec.description || '';
                              
                              return (
                                <li key={idx} className="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-900/10">
                                  <div className="flex gap-3">
                                    <Icon icon="solar:arrow-right-linear" width={20} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                    <div className="flex-1">
                                      <h5 className="font-semibold text-emerald-900 dark:text-emerald-200">{heading}</h5>
                                      {detail && <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-100">{detail}</p>}
                                    </div>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </section>
                      )}

                      {/* 5. Severity */}
                      {displayAnalysis.severity && displayAnalysis.severity !== 'unknown' && (
                        <section className="border-l-4 border-red-400 pl-4">
                          <h4 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">🔴 Severity Level</h4>
                          <div className="inline-flex">
                            <span className={`rounded-full px-6 py-3 text-sm font-bold uppercase tracking-wider ${severityClass(displayAnalysis.severity)}`}>
                              {displayAnalysis.severity}
                            </span>
                          </div>
                        </section>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

