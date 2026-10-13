import Link from "next/link";
import { requireUser } from "@/lib/server/current-user";
import { UserMenu } from "@/components/UserMenu";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight rounded outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            <span aria-hidden className="grid size-7 place-items-center rounded-md bg-blue-600 text-sm text-white">A</span>
            Ajaia Docs
          </Link>
          <UserMenu user={user} />
        </div>
      </header>
      {children}
    </>
  );
}
