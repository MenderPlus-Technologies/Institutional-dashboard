import { DashboardShell } from "@/components/DashboardShell";
import { PortalProvider } from "@/lib/portal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalProvider>
      <DashboardShell>{children}</DashboardShell>
    </PortalProvider>
  );
}
