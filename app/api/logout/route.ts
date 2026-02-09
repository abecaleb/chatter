import { NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase-server";

export async function POST() {
  const supabase = createRouteSupabase();
  await supabase.auth.signOut();
  return NextResponse.json({ message: "Logged out" });
}
