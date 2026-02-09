import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import { ApprovalsPanel } from "./panel";

const OWNER_EMAIL = process.env.OWNER_EMAIL;

export default async function AdminPage() {
  const supabase = createServerSupabase();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.user?.email || session.user.email !== OWNER_EMAIL) {
    redirect("/");
  }

  const { data: requests } = await supabase
    .from("access_requests")
    .select("id, email, message, status, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main>
      <h1>Owner approvals</h1>
      <ApprovalsPanel initialRequests={requests ?? []} />
    </main>
  );
}
