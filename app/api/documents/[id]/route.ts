import { NextResponse } from "next/server";
import { authedRoute, parseId, parseJson } from "@/server/http";
import { deleteDocument, getDocument, updateDocument } from "@/server/services/documents";
import { updateDocumentSchema } from "@/shared/schemas";

type P = { id: string };

export const GET = authedRoute<P>(async ({ params, user }) =>
  NextResponse.json({ document: await getDocument(user, parseId(params.id)) }),
);

export const PATCH = authedRoute<P>(async ({ req, params, user }) => {
  const id = parseId(params.id);
  const input = await parseJson(req, updateDocumentSchema);
  return NextResponse.json({ document: await updateDocument(user, id, input) });
});

export const DELETE = authedRoute<P>(async ({ params, user }) => {
  await deleteDocument(user, parseId(params.id));
  return new NextResponse(null, { status: 204 });
});

