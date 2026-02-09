import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/AuthPanel";
import { AccessRequest } from "@/components/AccessRequest";
import { ChatRoom } from "@/components/ChatRoom";
import { createServerSupabase } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const OWNER_EMAIL = process.env.OWNER_EMAIL;

export default async function Home() {
  const supabase = createServerSupabase();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.user?.email) {
    return (
      <main>
        <h1>Chatter</h1>
        <p className="small">WhatsApp style private group with Bruce Wayne AI clone.</p>
        <AccessRequest />
        <AuthPanel />
      </main>
    );
  }

  const email = session.user.email;
  const isOwner = email === OWNER_EMAIL;

  if (isOwner) {
    await supabaseAdmin.from("approved_users").upsert({ email });
  }

  const { data: approved } = await supabase.from("approved_users").select("email").eq("email", email).maybeSingle();

  if (!approved && !isOwner) {
    await supabase.auth.signOut();
    redirect("/");
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("id, content, sender_name, sender_type, created_at")
    .eq("room_id", "main")
    .order("created_at", { ascending: true })
    .limit(200);

  return (
    <main>
      <div className="panel">
        <h1>Welcome {email}</h1>
        <p className="small">Single room only. Session stays logged in until you log out manually.</p>
        {isOwner ? <a href="/admin">Open owner approvals</a> : null}
      </div>
      <ChatRoom initialMessages={messages ?? []} userEmail={email} />
    </main>
  );
}
