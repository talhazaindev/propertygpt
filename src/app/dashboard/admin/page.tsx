import { redirect } from "next/navigation";

/** Legacy mock admin dashboard — redirect to the real admin panel. */
export default function LegacyAdminDashboardPage() {
  redirect("/admin");
}
