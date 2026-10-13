import { NextResponse } from "next/server";
import { authedRoute, parseId, parseJson } from "@/server/http";
import { listShares, shareDocument } from "@/server/services/shares";
import { createShareSchema } from "@/shared/schemas";

type P = { id: string };

export const GET = authedRoute<P>(async ({ params, user }) =>
  NextResponse.json({ shares: await listShares(user, parseId(params.id)) }),
);

export const POST = authedRoute<P>(async ({ req, params, user }) => {
  const id = parseId(params.id);
  const input = await parseJson(req, createShareSchema);
  return NextResponse.json({ share: await shareDocument(user, id, input) }, { status: 201 });
});
