import Link from "next/link";
import { routePaths } from "@/client/config/routePaths";

export default function DocumentNotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center p-6 text-center">
      <h1 className="text-xl font-semibold">Document not available</h1>
      <p className="mt-2 text-sm text-slate-600">
        This document doesn&apos;t exist, or you don&apos;t have access to it. Ask the owner to share it with you.
      </p>
      <Link href={routePaths.home} className="mt-6 text-sm font-medium text-blue-600 hover:underline">Back to documents</Link>
    </main>
  );
}
