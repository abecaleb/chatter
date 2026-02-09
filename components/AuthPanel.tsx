"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export function AuthPanel() {
  const supabase = supabaseBrowser();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const sendMagicLink = async () => {
    setMsg("Sending...");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    setMsg(error ? error.message : "Check your email for the login link.");
  };

  return (
    <div className="panel">
      <h2>Step 2: Login</h2>
      <p className="small">Already approved? Enter your email to get a magic link.</p>
      <div className="row">
        <input placeholder="friend@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button onClick={sendMagicLink}>Send login link</button>
      </div>
      {msg ? <p className="small">{msg}</p> : null}
    </div>
  );
}
