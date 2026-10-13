import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/current-user";
import { getDocument } from "@/server/services/documents";
import { NotFound } from "@/server/errors";
import { uuidSchema } from "@/shared/schemas";
import { DocumentEditor } from "@/client/components/editor/DocumentEditor";

export const metadata: Metadata = { title: "Document" };

export default async function DocumentPage({ params }: PageProps<"/docs/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  if (!uuidSchema.safeParse(id).success) notFound();
  const doc = await getDocument(user, id).catch((err) => {
    // No access and doesn't exist look identical by design.
    if (err instanceof NotFound) notFound();
    throw err;
  });
  return <DocumentEditor key={doc.id} initial={doc} />;
}
