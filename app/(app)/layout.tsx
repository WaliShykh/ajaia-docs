import Link from "next/link";
import { requireUser } from "@/server/current-user";
import { routePaths } from "@/client/config/routePaths";
import { Logo } from "@/client/components/brand/Logo";
import { UserMenu } from "@/client/components/layout/UserMenu";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href={routePaths.home} aria-label="Ajaia Docs home" className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
            <Logo />
          </Link>
          <UserMenu user={user} />
        </div>
      </header>
      {children}
    </>
  );
}
