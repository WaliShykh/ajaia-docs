import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/current-user";
import { routePaths } from "@/client/config/routePaths";
import { AuthShell } from "@/client/components/auth/AuthShell";
import { SignupForm } from "@/client/components/auth/SignupForm";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage() {
  if (await getCurrentUser()) redirect(routePaths.home);
  return (
    <AuthShell title="Create your account" subtitle="Start writing and sharing in under a minute.">
      <SignupForm />
    </AuthShell>
  );
}
