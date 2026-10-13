import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server/current-user";
import { DEMO_PASSWORD, DEMO_USERS } from "@/lib/server/seed";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Ajaia Docs</h1>
          <p className="mt-1 text-sm text-slate-600">Sign in to create and share documents.</p>
        </div>
        <LoginForm demoUsers={DEMO_USERS.map((u) => ({ ...u }))} demoPassword={DEMO_PASSWORD} />
      </div>
    </main>
  );
}
