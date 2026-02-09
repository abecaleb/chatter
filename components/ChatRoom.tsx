"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Message } from "@/lib/types";

const ROOM = "main";

export function ChatRoom({ initialMessages, userEmail }: { initialMessages: Message[]; userEmail: string }) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [messages, setMessages] = useState(initialMessages);
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel("room-main")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${ROOM}` },
        (payload) => {
          const inserted = payload.new as Message & { room_id: string };
          setMessages((old) => [...old, inserted]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim() || sending) return;
    setSending(true);
    const text = value;
    setValue("");

    await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text, userEmail })
    });

    setSending(false);
  };

  return (
    <div className="panel">
      <h2>One-room chat (You + friends + Bruce Wayne AI)</h2>
      <div className="chat-window">
        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.sender_type}`}>
            <strong>{m.sender_name}: </strong>
            {m.content}
            <div className="small">{new Date(m.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
      <form className="row" onSubmit={send}>
        <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Write a message..." />
        <button disabled={sending}>{sending ? "Sending..." : "Send"}</button>
      </form>
    </div>
  );
}
