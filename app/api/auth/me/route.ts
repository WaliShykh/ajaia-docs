import { NextResponse } from "next/server";
import { authedRoute } from "@/server/http";

export const GET = authedRoute(async ({ user }) => NextResponse.json({ user }));
