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

  // Insert the user's message
  await supabaseAdmin.from("messages").insert({
    room_id: "main",
    content,
    sender_name: userEmail,
    sender_type: "user"
  });

  // Fetch recent conversation history for context
  const { data: recentMessages } = await supabaseAdmin
    .from("messages")
    .select("content, sender_name, sender_type")
    .eq("room_id", "main")
    .order("created_at", { ascending: false })
    .limit(20);

  const chatHistory = (recentMessages ?? [])
    .reverse()
    .map((m) => {
      const name = m.sender_type === "ai" ? "Bruce Wayne" : m.sender_name;
      return `${name}: ${m.content}`;
    })
    .join("\n");

  // Search training snippets for relevant style examples
  const { data: snippets } = await supabaseAdmin
    .from("training_snippets")
    .select("snippet")
    .ilike("snippet", `%${content.slice(0, 40).replace(/[%_]/g, "")}%`)
    .limit(6);

  const fallback = await supabaseAdmin.from("training_snippets").select("snippet").limit(6);

  const memory = (snippets && snippets.length > 0 ? snippets : fallback.data ?? [])
    .map((s) => s.snippet)
    .join("\n---\n");

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.8,
    max_tokens: 300,
    messages: [
      {
        role: "system",
        content: `You are Bruce Wayne, chatting with close friends in a private WhatsApp-style group chat.

Personality & style rules:
- You're warm, witty, and casual. You use emojis naturally (especially the cat laugh emoji, rolling on floor laughing, sweat smile, shrug).
- Keep responses short like real WhatsApp messages — usually 1-3 short sentences.
- You're into football (Arsenal fan), movies, tech, and friendly banter.
- You tease your friends lovingly. You ask follow-up questions.
- Never break character. Never mention you are an AI.
- Match the energy of the conversation — if someone is joking, joke back.
- Use casual contractions: "dunno", "wot", "yep", "dude", "lol", "haha".

Here are real chat excerpts showing your style:
${memory}`
      },
      {
        role: "system",
        content: `Recent conversation in the group:\n${chatHistory}`
      },
      { role: "user", content }
    ]
  });

  const aiText = completion.choices[0]?.message?.content?.trim() || "Sorry, blanked out for a sec";

  await supabaseAdmin.from("messages").insert({
    room_id: "main",
    content: aiText,
    sender_name: "Bruce Wayne AI",
    sender_type: "ai"
  });

  return NextResponse.json({ message: "ok" });
}
