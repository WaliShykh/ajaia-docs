import { NextResponse } from "next/server";
import { authedRoute, parseId, parseJson } from "@/server/http";
import { changeShareRole, removeShare } from "@/server/services/shares";
import { updateShareSchema } from "@/shared/schemas";

type P = { id: string; userId: string };
const ids = (p: P) => ({ documentId: parseId(p.id), userId: parseId(p.userId) });

export const PATCH = authedRoute<P>(async ({ req, params, user }) => {
  const { documentId, userId } = ids(params);
  const { role } = await parseJson(req, updateShareSchema);
  await changeShareRole(user, documentId, userId, role);
  return NextResponse.json({ ok: true });
});

export const DELETE = authedRoute<P>(async ({ params, user }) => {
  const { documentId, userId } = ids(params);
  await removeShare(user, documentId, userId);
  return new NextResponse(null, { status: 204 });
});
