"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Form } from "react-aria-components";
import { Button } from "../ui/Button";
import { TextField } from "../ui/TextField";
import { Alert } from "../ui/Alert";
import { Avatar } from "../ui/Avatar";
import { authService } from "@/client/services/authService";
import { routePaths } from "@/client/config/routePaths";

type DemoUser = { email: string; name: string };

export function LoginForm({ demoUsers, demoPassword }: { demoUsers: DemoUser[]; demoPassword: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  async function signIn(creds: { email: string; password: string }) {
    setPending(creds.email);
    setError(null);
    try {
      await authService.login(creds.email, creds.password);
      router.replace(routePaths.home);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setPending(null);
    }
  }

  const submitting = pending !== null && pending === email;

  return (
    <div className="space-y-8">
      <Form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void signIn({ email, password });
        }}
      >
        {error && <Alert>{error}</Alert>}
        <TextField label="Email" type="email" name="email" autoComplete="username" isRequired value={email} onChange={setEmail} placeholder="you@company.com" />
        <TextField label="Password" type="password" name="password" autoComplete="current-password" isRequired value={password} onChange={setPassword} />
        <Button type="submit" size="lg" className="w-full" isPending={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
        <p className="text-center text-sm text-slate-600">
          New here?{" "}
          <Link href={routePaths.signup} className="font-medium text-indigo-600 hover:text-indigo-500">Create an account</Link>
        </p>
      </Form>

      <section aria-labelledby="demo-heading">
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-slate-200" />
          <h2 id="demo-heading" className="text-xs font-medium uppercase tracking-wider text-slate-500">Or try a demo account</h2>
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <div className="mt-4 grid gap-2">
          {demoUsers.map((u) => (
            <Button
              key={u.email}
              variant="secondary"
              className="group h-auto justify-start gap-3 px-3 py-2.5 text-left"
              isDisabled={pending !== null}
              onPress={() => void signIn({ email: u.email, password: demoPassword })}
            >
              <Avatar name={u.name} size="md" className="ring-0" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-slate-900">Sign in as {u.name.split(" ")[0]}</span>
                <span className="block truncate text-xs font-normal text-slate-500">{u.email}</span>
              </span>
              <ArrowRight aria-hidden className="size-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-600" />
            </Button>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-slate-500">
          Demo password: <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-700">{demoPassword}</code>
        </p>
      </section>
    </div>
  );
}
