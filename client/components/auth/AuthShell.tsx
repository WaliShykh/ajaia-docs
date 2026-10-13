import type { ReactNode } from "react";
import { FileUp, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Logo } from "../brand/Logo";

const FEATURES = [
  { icon: Sparkles, title: "Write with real formatting", text: "Headings, lists, bold, italic, underline: saved as you type." },
  { icon: Users, title: "Share with the right access", text: "Invite teammates as viewers or editors and change it any time." },
  { icon: FileUp, title: "Bring your files", text: "Import .txt, .md and .docx straight into an editable doc." },
  { icon: ShieldCheck, title: "Secure by default", text: "Sanitised content, revocable sessions and strict access checks." },
];

/** Split-screen frame for the sign-in and sign-up pages. */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="grid flex-1 lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-600 p-12 text-white lg:flex lg:flex-col">
        <div aria-hidden className="absolute -right-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden className="absolute -bottom-32 -left-16 size-96 rounded-full bg-sky-400/20 blur-3xl" />
        <Logo inverted />
        <div className="relative mt-auto max-w-md">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">Docs your team can actually work in together.</h2>
          <ul className="mt-10 space-y-5">
            {FEATURES.map(({ icon: Icon, title: t, text }) => (
              <li key={t} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/20">
                  <Icon aria-hidden className="size-5" />
                </span>
                <span>
                  <span className="block font-medium">{t}</span>
                  <span className="block text-sm text-indigo-100">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative mt-auto pt-12 text-xs text-indigo-200">Built for the Ajaia AI-Native Full Stack assignment.</p>
      </section>

      <section className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <Logo className="mb-10 lg:hidden" />
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-1.5 text-sm text-slate-600">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </main>
  );
}
