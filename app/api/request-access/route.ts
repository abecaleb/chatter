import { NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const OWNER_EMAIL = process.env.OWNER_EMAIL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export async function POST(req: Request) {
  const { email, message } = await req.json();
  if (!email) return NextResponse.json({ message: "Email is required" }, { status: 400 });

  // Check if already approved
  const { data: existing } = await supabaseAdmin
    .from("approved_users")
    .select("email")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ message: "You're already approved! Use the login form below to get your magic link." });
  }

  // Check for duplicate pending request
  const { data: pendingReq } = await supabaseAdmin
    .from("access_requests")
    .select("id")
    .eq("email", email)
    .eq("status", "pending")
    .maybeSingle();

  if (pendingReq) {
    return NextResponse.json({ message: "You already have a pending request. Bruce will get to it soon!" });
  }

  const { error } = await supabaseAdmin.from("access_requests").insert({ email, message, status: "pending" });
  if (error) return NextResponse.json({ message: error.message }, { status: 400 });

  // Notify the owner via Supabase magic link email (sends them an email as a side-effect nudge)
  // We use a system message in the chat so the owner sees it when they open the app
  await supabaseAdmin.from("messages").insert({
    room_id: "main",
    content: `Access request from ${email}: "${message || "No message"}"`,
    sender_name: "System",
    sender_type: "system"
  });

  return NextResponse.json({ message: "Request sent! Bruce will be notified. Once approved, you'll get a login link by email." });
}

export async function PATCH(req: Request) {
  const supabase = createRouteSupabase();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.user?.email || session.user.email !== OWNER_EMAIL) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id, status } = await req.json();
  const { data: row, error: loadError } = await supabaseAdmin
    .from("access_requests")
    .select("email")
    .eq("id", id)
    .maybeSingle();

  if (loadError || !row) return NextResponse.json({ message: "Request not found" }, { status: 404 });

  await supabaseAdmin.from("access_requests").update({ status }).eq("id", id);

  if (status === "approved") {
    // Add to approved users
    await supabaseAdmin.from("approved_users").upsert({ email: row.email });

    // Send them a magic link invite so they can log in immediately
    const redirectTo = (process.env.NEXT_PUBLIC_SITE_URL || SITE_URL) + "/auth/callback";
    await supabaseAdmin.auth.admin.inviteUserByEmail(row.email, { redirectTo });

    // Post a system message so the group knows
    await supabaseAdmin.from("messages").insert({
      room_id: "main",
      content: `${row.email} has been approved and invited to the chat!`,
      sender_name: "System",
      sender_type: "system"
    });

    return NextResponse.json({ message: `Approved! Login link sent to ${row.email}.` });
  }

  if (status === "rejected") {
    return NextResponse.json({ message: `Rejected ${row.email}.` });
  }

  return NextResponse.json({ message: "Updated" });
}
