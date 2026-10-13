import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/current-user";
import { DEMO_PASSWORD, DEMO_USERS } from "@/server/seed";
import { routePaths } from "@/client/config/routePaths";
import { AuthShell } from "@/client/components/auth/AuthShell";
import { LoginForm } from "@/client/components/auth/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect(routePaths.home);
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your documents.">
      <LoginForm demoUsers={DEMO_USERS.map((u) => ({ ...u }))} demoPassword={DEMO_PASSWORD} />
    </AuthShell>
  );
}
