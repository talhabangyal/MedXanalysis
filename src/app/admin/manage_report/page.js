"use client";

import { useCallback, useEffect, useState } from "react";
// Database operations use API calls instead
import { Icon } from "@iconify/react";
import { apiClient } from "@/lib/api-client";

function reportStatusClass(status) {
  const s = status?.toLowerCase();
  if (s === "reviewed" || s === "completed") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
  if (s === "pending" || s === "reviewing") return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
  return "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300";
}

export default function AdminManageReportPage() {
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [, setLoading] = useState(true);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [activeReportId, setActiveReportId] = useState(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const [reportData, usersData] = await Promise.all([
        apiClient.admin.getReports(),
        apiClient.admin.getUsers(),
      ]);

      const usersById = new Map((usersData || []).map((u) => [u.id, u]));

      setReports((reportData || []).map((r) => {
        const linkedUser = usersById.get(r.userId || r.user_id || "");
        const firstName = linkedUser?.firstName || linkedUser?.first_name || r?.users?.firstName || r?.users?.first_name || "";
        const lastName = linkedUser?.lastName || linkedUser?.last_name || r?.users?.lastName || r?.users?.last_name || "";
        const name = `${firstName} ${lastName}`.trim() || linkedUser?.username || "Unknown User";
        const email = linkedUser?.email || r?.users?.email || "N/A";

        return {
          id: r.id,
          name,
          email,
          reportType: r.reportType || r.report_type || "Medical Report",
          reportStatus: r.reportStatus || r.report_status || "pending",
          url: r.reportUrl || r.report_url || r.reportFileUrl || r.report_file_url || "",
          analyzedReport: r.analyzedReport || r.analyzed_report || "",
        };
      }) || []);
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  }, []);

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

  const analyzeReport = async (reportId) => {
    try {
      setActiveReportId(reportId);
      const result = await apiClient.admin.analyzeReport(reportId);
      const analyzedReport = result?.analyzedReport || result?.analyzed_report || result?.data?.analyzedReport || result?.data?.analyzed_report || "Analysis completed.";
      setAnalysisResult({ reportId, analyzedReport });
      
      await apiClient.admin.createActivity({
        user_id: user.id,
        action: "analyze_report",
        description: `Analyzed report #${reportId}`,
        source: "admin",
      });

      loadReports();
    } catch (err) {
      console.error("Update status error:", err);
    } finally {
      setActiveReportId(null);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Report</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">View submitted reports and check their status.</p>
      </div>

      {analysisResult && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
          <div className="mb-2 font-semibold">Latest analysis for report #{analysisResult.reportId.slice(0, 8).toUpperCase()}</div>
          <div className="whitespace-pre-wrap leading-6">{analysisResult.analyzedReport}</div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Report Type</th>
                <th className="px-6 py-4 font-semibold">Report Status</th>
                <th className="px-6 py-4 font-semibold">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {reports.map((report) => (
                <tr key={report.id} className="text-sm text-slate-700 dark:text-slate-200">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{report.name}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{report.email}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{report.reportType}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${reportStatusClass(report.reportStatus)}`}>
                      {report.reportStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => analyzeReport(report.id)}
                        title="Analyze Report"
                        disabled={activeReportId === report.id}
                        className="rounded-lg border border-slate-200 p-2 text-emerald-500 transition hover:border-emerald-200 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/10"
                      >
                        <Icon icon={activeReportId === report.id ? "eos-icons:loading" : "solar:check-read-linear"} width={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => report.url && window.open(report.url, "_blank")}
                        disabled={!report.url}
                        title="View Report"
                        className="rounded-lg border border-slate-200 p-2 text-blue-500 transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:hover:border-cyan-500/30 dark:hover:bg-cyan-500/10"
                      >
                        <Icon icon="solar:eye-linear" width={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {reports.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    No reports found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
