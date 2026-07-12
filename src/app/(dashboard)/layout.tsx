import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/auth";

/**
 * All dynasty pages live under this group so they share the app shell (sidebar +
 * topbar). The landing, login, and onboarding routes sit outside it and render
 * chrome-free. Logged-out visitors are bounced to the login screen.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <AppShell>{children}</AppShell>;
}
