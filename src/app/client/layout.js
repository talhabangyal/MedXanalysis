import DashboardShell from "@/components/dashboard-shell.jsx";

export default function ClientLayout({ children }) {
  return <DashboardShell role="client">{children}</DashboardShell>;
}
