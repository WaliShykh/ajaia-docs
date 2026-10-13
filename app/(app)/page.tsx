import type { Metadata } from "next";
import { requireUser } from "@/lib/server/current-user";
import { listDocuments } from "@/lib/server/services/documents";
import { Dashboard } from "@/components/dashboard/Dashboard";

export const metadata: Metadata = { title: "Documents" };

export default async function DashboardPage() {
  const user = await requireUser();
  const [owned, shared] = await Promise.all([
    listDocuments(user, "owned"),
    listDocuments(user, "shared"),
  ]);
  return <Dashboard initialOwned={owned} initialShared={shared} />;
}
