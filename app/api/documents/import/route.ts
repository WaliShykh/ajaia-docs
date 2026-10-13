import { NextResponse } from "next/server";
import { authedRoute } from "@/server/http";
import { importDocument } from "@/server/services/import";
import { PayloadTooLarge, ValidationError } from "@/server/errors";
import { IMPORT_HELP, LIMITS } from "@/shared/limits";

export const POST = authedRoute(async ({ req, user }) => {
  // Reject oversized uploads before buffering the body.
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > LIMITS.uploadMaxBytes + 64 * 1024) throw new PayloadTooLarge(`File is too large. ${IMPORT_HELP}`);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new ValidationError("Expected a multipart form upload.");
  }
  const file = form.get("file");
  if (!(file instanceof File)) throw new ValidationError("Choose a file to import.");
  if (file.size > LIMITS.uploadMaxBytes) throw new PayloadTooLarge(`File is too large. ${IMPORT_HELP}`);

  const document = await importDocument(user, { name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) });
  return NextResponse.json({ document }, { status: 201 });
});
