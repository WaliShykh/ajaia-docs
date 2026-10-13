import type { Metadata } from "next";
import { requireUser } from "@/server/current-user";
import { listDocuments } from "@/server/services/documents";
import { Dashboard } from "@/client/components/dashboard/Dashboard";

export const metadata: Metadata = { title: "Documents" };

export default async function DashboardPage() {
  const user = await requireUser();
  const [owned, shared] = await Promise.all([
    listDocuments(user, "owned"),
    listDocuments(user, "shared"),
  ]);
  return <Dashboard user={user} initialOwned={owned} initialShared={shared} />;
}
