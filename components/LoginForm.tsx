"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Form } from "react-aria-components";
import { Button } from "./ui/Button";
import { TextField } from "./ui/TextField";
import { Alert } from "./ui/Alert";
import { api } from "@/lib/client/api";

type DemoUser = { email: string; name: string };

export function LoginForm({ demoUsers, demoPassword }: { demoUsers: DemoUser[]; demoPassword: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function signIn(creds: { email: string; password: string }) {
    setPending(true);
    setError(null);
    try {
      await api("/api/auth/login", { method: "POST", json: creds });
      router.replace("/");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <Form
        className="space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
        onSubmit={(e) => {
          e.preventDefault();
          void signIn({ email, password });
        }}
      >
        {error && <Alert>{error}</Alert>}
        <TextField label="Email" type="email" name="email" autoComplete="username" isRequired value={email} onChange={setEmail} />
        <TextField label="Password" type="password" name="password" autoComplete="current-password" isRequired value={password} onChange={setPassword} />
        <Button type="submit" className="w-full" isPending={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </Form>

      <section aria-labelledby="demo-heading" className="rounded-xl border border-dashed border-slate-300 p-4">
        <h2 id="demo-heading" className="text-sm font-medium text-slate-800">Demo accounts</h2>
        <p className="mt-1 text-xs text-slate-600">
          All use the password <code className="rounded bg-slate-100 px-1">{demoPassword}</code>. Sign in as different users to try sharing.
        </p>
        <div className="mt-3 grid gap-2">
          {demoUsers.map((u) => (
            <Button
              key={u.email}
              variant="secondary"
              className="justify-between"
              isDisabled={pending}
              onPress={() => void signIn({ email: u.email, password: demoPassword })}
            >
              <span>Sign in as {u.name.split(" ")[0]}</span>
              <span className="text-xs text-slate-500">{u.email}</span>
            </Button>
          ))}
        </div>
      </section>
    </div>
  );
}
