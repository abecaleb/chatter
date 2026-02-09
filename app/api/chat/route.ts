import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createRouteSupabase } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const OWNER_EMAIL = process.env.OWNER_EMAIL;

export async function POST(req: Request) {
  const { content, userEmail } = await req.json();
  if (!content || !userEmail) return NextResponse.json({ message: "Missing fields" }, { status: 400 });

  const supabase = createRouteSupabase();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.user?.email || session.user.email !== userEmail) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { data: approved } = await supabaseAdmin.from("approved_users").select("email").eq("email", userEmail).maybeSingle();
  if (!approved && userEmail !== OWNER_EMAIL) {
    return NextResponse.json({ message: "Not approved" }, { status: 403 });
  }

  await supabaseAdmin.from("messages").insert({
    room_id: "main",
    content,
    sender_name: userEmail,
    sender_type: "user"
  });

  const { data: snippets } = await supabaseAdmin
    .from("training_snippets")
    .select("snippet")
    .ilike("snippet", `%${content.slice(0, 24)}%`)
    .limit(8);

  const fallback = await supabaseAdmin.from("training_snippets").select("snippet").limit(8);

  const memory = (snippets && snippets.length > 0 ? snippets : fallback.data ?? [])
    .map((s) => s.snippet)
    .join("\n---\n");

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.8,
    messages: [
      {
        role: "system",
        content:
          "You are Bruce Wayne, chatting with close friends in a casual WhatsApp group. Keep responses natural, short-to-medium, warm, and personal."
      },
      {
        role: "system",
        content: `Style memory from real chats:\n${memory}`
      },
      { role: "user", content }
    ]
  });

  const aiText = completion.choices[0]?.message?.content?.trim() || "Sorry, I blanked out for a sec.";

  await supabaseAdmin.from("messages").insert({
    room_id: "main",
    content: aiText,
    sender_name: "Bruce Wayne AI",
    sender_type: "ai"
  });

  return NextResponse.json({ message: "ok" });
}
