"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { apiClient } from "@/lib/api-client";
// Database operations use API calls instead

export default function LogsPage() {
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLogType, setSelectedLogType] = useState("general");
  const [selectedLevel, setSelectedLevel] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);

  const logTypes = ["general", "admin", "client", "system", "auth", "doctore", "enterprise"];
  const logLevels = ["ALL", "DEBUG", "INFO", "WARNING", "ERROR"];

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.admin.getLogs();
      const formattedLogs = (data || []).map((log) => ({
        id: String(log.id),
        timestamp: log.timestamp || log.createdAt || log.created_at || log.created || null,
        level: (log.logType || log.level || "INFO").toUpperCase(),
        message: log.message || log.description || "",
        source: (log.source || log.category || "system").toLowerCase(),
        metadata: log.metadata || {},
      }));
      setLogs(formattedLogs);
    } catch (error) {
      console.error("Error fetching logs:", error);
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
        fetchLogs();
      });
    }
  }, [fetchLogs, user]);

  const fetchStats = async () => {
    try {
      // STATIC MOCK
      await new Promise((resolve) => setTimeout(resolve, 400));
      const byLevel = logs.reduce((acc, log) => {
        const key = (log.level || "INFO").toUpperCase();
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      setStats({
          total: logs.length,
          byLevel,
          latest: { timestamp: new Date().toISOString() }
      });
      setShowStats(true);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
  };

  // Filter and search logs
  const filteredLogs = useMemo(() => {
    let filtered = [...logs];

    if (selectedLogType !== "general") {
      filtered = filtered.filter((log) => (log.source || "system") === selectedLogType.toLowerCase());
    }

    // Filter by level
    if (selectedLevel !== "ALL") {
      filtered = filtered.filter((log) => log.level === selectedLevel);
    }

    // Search by term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.message.toLowerCase().includes(term) ||
          String(log.id).toLowerCase().includes(term) ||
          String(log.source || "").toLowerCase().includes(term) ||
          JSON.stringify(log.metadata).toLowerCase().includes(term)
      );
    }

    // Sort
    if (sortBy === "newest") {
      filtered.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } else if (sortBy === "oldest") {
      filtered.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    }

    return filtered;
  }, [logs, searchTerm, selectedLevel, selectedLogType, sortBy]);

  const handleExport = async () => {
    try {
      // STATIC MOCK
      const headers = "ID,Timestamp,Level,Message\n";
      const rows = logs.map(l => `${l.id},${l.timestamp},${l.level},"${l.message}"`).join("\n");
      const csv = headers + rows;

      // Create download link
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `logs-${selectedLogType}-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting logs:", error);
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case "DEBUG":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:border dark:border-blue-800 dark:text-blue-200";
      case "INFO":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:border dark:border-emerald-800 dark:text-emerald-200";
      case "WARNING":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:border dark:border-amber-800 dark:text-amber-200";
      case "ERROR":
        return "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:border dark:border-rose-800 dark:text-rose-200";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-900/50 dark:text-slate-200";
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case "DEBUG":
        return "solar:bug-linear";
      case "INFO":
        return "solar:info-circle-linear";
      case "WARNING":
        return "solar:danger-triangle-linear";
      case "ERROR":
        return "solar:close-circle-linear";
      default:
        return "solar:question-circle-linear";
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          System Logs
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Monitor and analyze system, admin, and client activities.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Log Type
            </label>
            <select
              value={selectedLogType}
              onChange={(e) => setSelectedLogType(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-transparent text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition dark:border-slate-700 dark:focus:border-cyan-400 dark:focus:ring-cyan-400"
            >
              {logTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Log Level
            </label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-transparent text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition dark:border-slate-700 dark:focus:border-cyan-400 dark:focus:ring-cyan-400"
            >
              {logLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-transparent text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition dark:border-slate-700 dark:focus:border-cyan-400 dark:focus:ring-cyan-400"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-transparent text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition dark:border-slate-700 dark:focus:border-cyan-400 dark:focus:ring-cyan-400"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={fetchLogs}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
          >
            <Icon icon="solar:refresh-linear" width={18} />
            Refresh
          </button>
          <button
            onClick={fetchStats}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:text-purple-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
          >
            <Icon icon="solar:chart-square-linear" width={18} />
            Statistics
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 dark:bg-cyan-400 dark:text-slate-950"
          >
            <Icon icon="solar:download-linear" width={18} />
            Export CSV
          </button>
        </div>
      </div>

      {showStats && stats && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Statistics</h2>
            <button
              onClick={() => setShowStats(false)}
              className="text-slate-500 transition hover:text-rose-500"
            >
              <Icon icon="solar:close-circle-linear" width={24} />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-cyan-500/30 dark:bg-cyan-400/5">
              <p className="text-sm font-medium text-blue-700 dark:text-cyan-300">Total Logs</p>
              <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
            </div>

            {Object.entries(stats.byLevel || {}).map(([level, count]) => (
              <div key={level} className={`rounded-xl p-4 ${getLevelColor(level)}`}>
                <p className="text-sm font-medium capitalize">{level}</p>
                <p className="mt-1 text-3xl font-bold">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Icon icon="eos-icons:loading" width={40} className="mb-4 text-blue-600 dark:text-cyan-400" />
            <p>Loading logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Icon icon="solar:inbox-line-duotone" width={48} className="mb-4 text-slate-400" />
            <p>No logs found for this criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Time</th>
                  <th className="px-6 py-4 font-semibold">Source</th>
                  <th className="px-6 py-4 font-semibold">Level</th>
                  <th className="px-6 py-4 font-semibold">Message</th>
                  <th className="px-6 py-4 font-semibold">ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="align-top hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 capitalize whitespace-nowrap">
                      {log.source || "system"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${getLevelColor(log.level)}`}>
                        <Icon icon={getLevelIcon(log.level)} width={14} />
                        {log.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-900 dark:text-slate-200">
                      <div className="max-w-xl">
                        <p className="font-medium">{log.message}</p>
                        {Object.keys(log.metadata || {}).length > 0 && (
                          <details className="mt-2 text-slate-500 group">
                            <summary className="cursor-pointer text-xs text-blue-600 outline-none hover:underline dark:text-cyan-400">
                              View metadata
                            </summary>
                            <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-slate-100 p-3 text-xs dark:bg-slate-900">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {log.id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
