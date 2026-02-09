import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ApprovalsPanel } from "./panel";

export const dynamic = "force-dynamic";

const OWNER_EMAIL = process.env.OWNER_EMAIL;

export default async function AdminPage() {
  const supabase = createServerSupabase();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.user?.email || session.user.email !== OWNER_EMAIL) {
    redirect("/");
  }

  // Use admin client to bypass RLS on access_requests
  const { data: requests } = await supabaseAdmin
    .from("access_requests")
    .select("id, email, message, status, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main>
      <h1>Owner approvals</h1>
      <a href="/" style={{ color: "var(--accent)" }}>&larr; Back to chat</a>
      <ApprovalsPanel initialRequests={requests ?? []} />
    </main>
  );
}
