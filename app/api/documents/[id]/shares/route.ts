import { NextResponse } from "next/server";
import { authedRoute, parseId, parseJson } from "@/lib/server/http";
import { listShares, shareDocument } from "@/lib/server/services/shares";
import { createShareSchema } from "@/lib/shared/schemas";

type P = { id: string };

export const GET = authedRoute<P>(async ({ params, user }) =>
  NextResponse.json({ shares: await listShares(user, parseId(params.id)) }),
);

export const POST = authedRoute<P>(async ({ req, params, user }) => {
  const id = parseId(params.id);
  const input = await parseJson(req, createShareSchema);
  return NextResponse.json({ share: await shareDocument(user, id, input) }, { status: 201 });
});
