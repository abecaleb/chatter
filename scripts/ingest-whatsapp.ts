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

const bruceLines = lines
  .filter((line) => /bruce wayne/i.test(line))
  .map((line) => line.replace(/^\[[^\]]+\]\s*/, ""));

const snippets = [] as string[];
for (let i = 0; i < bruceLines.length; i += 4) {
  const chunk = bruceLines.slice(i, i + 4).join("\n").trim();
  if (chunk.length > 20) snippets.push(chunk.slice(0, 1200));
}

async function main() {
  if (snippets.length === 0) throw new Error("No Bruce Wayne lines found.");
  await supabase.from("training_snippets").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const { error } = await supabase.from("training_snippets").insert(snippets.map((snippet) => ({ snippet })));
  if (error) throw error;
  console.log(`Inserted ${snippets.length} snippets.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
