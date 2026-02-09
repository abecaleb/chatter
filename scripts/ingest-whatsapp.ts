import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) throw new Error("Missing Supabase env vars.");

const supabase = createClient(url, key, { auth: { persistSession: false } });

const source = path.resolve(process.cwd(), "WhatsApp Chat with Intel footie .txt");
const raw = fs.readFileSync(source, "utf8");
const lines = raw.split(/\r?\n/).filter(Boolean);

// Parse each line into structured format
const LINE_RE = /^(\d{1,2}\/\d{1,2}\/\d{2,4},\s*\d{1,2}:\d{2})\s*-\s*(.+?):\s*(.+)$/;

type ChatLine = { date: string; sender: string; text: string; raw: string };

const parsed: ChatLine[] = [];
for (const line of lines) {
  const match = LINE_RE.exec(line);
  if (match) {
    parsed.push({ date: match[1], sender: match[2].trim(), text: match[3].trim(), raw: line });
  }
}

// Find all Bruce Wayne message indexes
const bruceIndexes: number[] = [];
for (let i = 0; i < parsed.length; i++) {
  if (/^bruce wayne$/i.test(parsed[i].sender)) {
    bruceIndexes.push(i);
  }
}

// Build conversation windows around Bruce's messages.
// For each Bruce message, grab 3 messages before and 2 after for context.
const CONTEXT_BEFORE = 3;
const CONTEXT_AFTER = 2;
const MAX_SNIPPET_LEN = 1500;

const windows = new Set<string>();
const snippets: string[] = [];

for (const idx of bruceIndexes) {
  const start = Math.max(0, idx - CONTEXT_BEFORE);
  const end = Math.min(parsed.length - 1, idx + CONTEXT_AFTER);
  const key = `${start}-${end}`;
  if (windows.has(key)) continue;
  windows.add(key);

  const chunk = parsed
    .slice(start, end + 1)
    .filter((l) => l.text !== "<Media omitted>" && l.text !== "<This message was edited>")
    .map((l) => `${l.sender}: ${l.text}`)
    .join("\n")
    .trim();

  if (chunk.length > 30) {
    snippets.push(chunk.slice(0, MAX_SNIPPET_LEN));
  }
}

// Also extract Bruce-only lines for style reference (emoji patterns, slang, etc.)
const bruceOnlyLines = parsed
  .filter((l) => /^bruce wayne$/i.test(l.sender) && l.text !== "<Media omitted>")
  .map((l) => l.text);

// Group Bruce's solo lines into chunks of 8 for style snippets
for (let i = 0; i < bruceOnlyLines.length; i += 8) {
  const chunk = bruceOnlyLines.slice(i, i + 8).join("\n").trim();
  if (chunk.length > 30) {
    snippets.push(`[Bruce Wayne style samples]\n${chunk.slice(0, MAX_SNIPPET_LEN)}`);
  }
}

async function main() {
  if (snippets.length === 0) throw new Error("No Bruce Wayne conversation snippets found.");

  // Clear existing snippets
  await supabase.from("training_snippets").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // Insert in batches of 50
  for (let i = 0; i < snippets.length; i += 50) {
    const batch = snippets.slice(i, i + 50).map((snippet) => ({ snippet }));
    const { error } = await supabase.from("training_snippets").insert(batch);
    if (error) throw error;
  }

  console.log(`Parsed ${parsed.length} chat lines total.`);
  console.log(`Found ${bruceIndexes.length} Bruce Wayne messages.`);
  console.log(`Inserted ${snippets.length} training snippets (conversation windows + style samples).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
