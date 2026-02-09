import { NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const OWNER_EMAIL = process.env.OWNER_EMAIL;

async function notifyOwner(email: string, message: string) {
  const resendKey = process.env.RESEND_API_KEY;
  const ownerNotifyEmail = process.env.OWNER_NOTIFY_EMAIL ?? OWNER_EMAIL;

  if (!resendKey || !ownerNotifyEmail) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "Chatter <onboarding@resend.dev>",
      to: ownerNotifyEmail,
      subject: `New Chatter access request: ${email}`,
      html: `<p><strong>${email}</strong> requested access.</p><p>${message || "No message provided."}</p>`
    })
  });
}

export async function POST(req: Request) {
  const { email, message } = await req.json();
  if (!email) return NextResponse.json({ message: "Email is required" }, { status: 400 });

  const { error } = await supabaseAdmin.from("access_requests").insert({ email, message, status: "pending" });
  if (error) return NextResponse.json({ message: error.message }, { status: 400 });

  await notifyOwner(email, message ?? "");

  return NextResponse.json({ message: "Request sent. Bruce will approve you soon." });
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
    await supabaseAdmin.from("approved_users").upsert({ email: row.email });
  }

  return NextResponse.json({ message: "Updated" });
}
