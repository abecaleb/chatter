import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/AuthPanel";
import { AccessRequest } from "@/components/AccessRequest";
import { ChatRoom } from "@/components/ChatRoom";
import { createServerSupabase } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const OWNER_EMAIL = process.env.OWNER_EMAIL;

export default async function Home() {
  const supabase = createServerSupabase();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.user?.email) {
    return (
      <main>
        <div className="landing">
          <h1>Chatter</h1>
          <p className="small">Private group chat with Bruce Wayne AI.</p>
          <AccessRequest />
          <AuthPanel />
        </div>
      </main>
    );
  }

  const email = session.user.email;
  const isOwner = email === OWNER_EMAIL;

  // Use admin client to check approval (bypasses RLS)
  const { data: approved } = await supabaseAdmin
    .from("approved_users")
    .select("email")
    .eq("email", email)
    .maybeSingle();

  if (!approved && !isOwner) {
    await supabase.auth.signOut();
    redirect("/");
  }

  // If owner isn't in approved_users yet, auto-add them
  if (isOwner && !approved) {
    await supabaseAdmin.from("approved_users").upsert({ email });
  }

  const { data: messages } = await supabaseAdmin
    .from("messages")
    .select("id, content, sender_name, sender_type, created_at")
    .eq("room_id", "main")
    .order("created_at", { ascending: true })
    .limit(200);

  return (
    <main>
      <ChatRoom initialMessages={messages ?? []} userEmail={email} isOwner={isOwner} />
    </main>
  );
}
