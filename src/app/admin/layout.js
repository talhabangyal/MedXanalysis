import DashboardShell from "@/components/dashboard-shell.jsx";

export default function AdminLayout({ children }) {
  return <DashboardShell role="admin">{children}</DashboardShell>;
}
