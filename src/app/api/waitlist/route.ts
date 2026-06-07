import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/server";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type WaitlistBody = {
  email?: unknown;
  source?: unknown;
};

export async function POST(request: Request) {
  let body: WaitlistBody;

  try {
    body = (await request.json()) as WaitlistBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();
  const source = typeof body.source === "string" && body.source.trim()
    ? body.source.trim().slice(0, 64)
    : "landing";

  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Waitlist storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 503 }
    );
  }

  const { error } = await supabase
    .from("waitlist_signups")
    .insert({ email, source });

  if (!error) {
    return NextResponse.json(
      { message: "Successfully joined the Dralvo waitlist", email },
      { status: 201 }
    );
  }

  if (error.code === "23505") {
    return NextResponse.json(
      { message: "You're already on the Dralvo waitlist", email },
      { status: 200 }
    );
  }

  console.error("[waitlist] Supabase insert error", JSON.stringify(error));

  return NextResponse.json(
    { error: "Could not join the waitlist. Please try again." },
    { status: 500 }
  );
}
