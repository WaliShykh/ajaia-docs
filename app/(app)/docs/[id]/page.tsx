import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/current-user";
import { getDocument } from "@/server/services/documents";
import { NotFound } from "@/server/errors";
import { uuidSchema } from "@/shared/schemas";
import { DocumentEditor } from "@/client/components/editor/DocumentEditor";

// Shared by generateMetadata and the page so the document is loaded once per request.
const loadDocument = cache(async (id: string) => {
  const user = await requireUser();
  if (!uuidSchema.safeParse(id).success) notFound();
  return getDocument(user, id).catch((err) => {
    // No access and doesn't exist look identical by design.
    if (err instanceof NotFound) notFound();
    throw err;
  });
});

export async function generateMetadata({ params }: PageProps<"/docs/[id]">): Promise<Metadata> {
  const doc = await loadDocument((await params).id);
  return { title: doc.title };
}

export default async function DocumentPage({ params }: PageProps<"/docs/[id]">) {
  const doc = await loadDocument((await params).id);
  return <DocumentEditor key={doc.id} initial={doc} />;
}
