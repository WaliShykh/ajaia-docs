import { NextResponse } from "next/server";
import { authedRoute } from "@/lib/server/http";

export const GET = authedRoute(async ({ user }) => NextResponse.json({ user }));
