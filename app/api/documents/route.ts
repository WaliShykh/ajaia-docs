import { NextResponse } from "next/server";
import { authedRoute, parseJson, parseWith } from "@/server/http";
import { createDocument, listDocuments } from "@/server/services/documents";
import { createDocumentSchema, listQuerySchema } from "@/shared/schemas";

export const GET = authedRoute(async ({ req, user }) => {
  const q = parseWith(listQuerySchema, Object.fromEntries(req.nextUrl.searchParams));
  return NextResponse.json(await listDocuments(user, q.scope, q));
});

export const POST = authedRoute(async ({ req, user }) => {
  const input = await parseJson(req, createDocumentSchema);
  return NextResponse.json({ document: await createDocument(user, input) }, { status: 201 });
});
