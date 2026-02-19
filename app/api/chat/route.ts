import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createRouteSupabase } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const OWNER_EMAIL = process.env.OWNER_EMAIL;
const MAX_MESSAGE_LENGTH = 2000;

export async function POST(req: Request) {
  const { content, userEmail } = await req.json();
  const normalizedContent = typeof content === "string" ? content.trim() : "";

  if (!normalizedContent || typeof userEmail !== "string") {
    return NextResponse.json({ message: "Missing fields" }, { status: 400 });
  }

  if (normalizedContent.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { message: `Message is too long. Max ${MAX_MESSAGE_LENGTH} characters.` },
      { status: 400 }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ message: "Chat model is not configured." }, { status: 500 });
  }

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
  const { error: userInsertError } = await supabaseAdmin.from("messages").insert({
    room_id: "main",
    content: normalizedContent,
    sender_name: userEmail,
    sender_type: "user"
  });

  if (userInsertError) {
    return NextResponse.json({ message: "Failed to save message." }, { status: 500 });
  }

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
    .ilike("snippet", `%${normalizedContent.slice(0, 40).replace(/[%_]/g, "")}%`)
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
      { role: "user", content: normalizedContent }
    ]
  });

  const aiText = completion.choices[0]?.message?.content?.trim() || "Sorry, blanked out for a sec";

  const { error: aiInsertError } = await supabaseAdmin.from("messages").insert({
    room_id: "main",
    content: aiText,
    sender_name: "Bruce Wayne AI",
    sender_type: "ai"
  });

  if (aiInsertError) {
    return NextResponse.json({ message: "Failed to save AI response." }, { status: 500 });
  }

  return NextResponse.json({ message: "ok" });
}
