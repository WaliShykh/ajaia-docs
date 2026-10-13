"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Form } from "react-aria-components";
import { Button } from "../ui/Button";
import { TextField } from "../ui/TextField";
import { Alert } from "../ui/Alert";
import { toast } from "../ui/Toast";
import { authService } from "@/client/services/authService";
import { routePaths } from "@/client/config/routePaths";
import { LIMITS } from "@/shared/limits";

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    setError(null);
    try {
      const { user } = await authService.signup(name, email, password);
      toast.success(`Welcome, ${user.name.split(" ")[0]}!`, "Your account is ready. Create your first document.");
      router.replace(routePaths.home);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setPending(false);
    }
  }

  return (
    <Form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      {error && <Alert>{error}</Alert>}
      <TextField label="Full name" name="name" autoComplete="name" isRequired maxLength={80} value={name} onChange={setName} placeholder="Ada Lovelace" />
      <TextField label="Work email" type="email" name="email" autoComplete="email" isRequired value={email} onChange={setEmail} placeholder="you@company.com" />
      <TextField
        label="Password"
        type="password"
        name="password"
        autoComplete="new-password"
        isRequired
        minLength={LIMITS.passwordMin}
        value={password}
        onChange={setPassword}
        description={`At least ${LIMITS.passwordMin} characters.`}
      />
      <Button type="submit" size="lg" className="w-full" isPending={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href={routePaths.login} className="font-medium text-indigo-600 hover:text-indigo-500">Sign in</Link>
      </p>
    </Form>
  );
}
