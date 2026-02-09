"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Message } from "@/lib/types";

const ROOM = "main";

export function ChatRoom({
  initialMessages,
  userEmail,
  isOwner
}: {
  initialMessages: Message[];
  userEmail: string;
  isOwner: boolean;
}) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [messages, setMessages] = useState(initialMessages);
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("room-main")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${ROOM}` },
        (payload) => {
          const inserted = payload.new as Message & { room_id: string };
          setMessages((old) => {
            // Deduplicate by id
            if (old.some((m) => m.id === inserted.id)) return old;
            return [...old, inserted];
          });
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

  const logout = async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <h2>Intel footie</h2>
          <span className="chat-subtitle">You, Bruce Wayne AI &amp; friends</span>
        </div>
        <div className="chat-header-actions">
          {isOwner && (
            <a href="/admin" className="header-link">
              Admin
            </a>
          )}
          <button onClick={logout} className="btn-logout">
            Logout
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-window">
        {messages.map((m) => {
          const isMe = m.sender_type === "user" && m.sender_name === userEmail;
          const isAi = m.sender_type === "ai";
          const align = isMe ? "me" : isAi ? "ai" : "them";

          return (
            <div key={m.id} className={`msg ${align}`}>
              {!isMe && <div className="msg-sender">{isAi ? "Bruce Wayne" : m.sender_name}</div>}
              <div className="msg-text">{m.content}</div>
              <div className="msg-time">{formatTime(m.created_at)}</div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form className="chat-input" onSubmit={send}>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type a message"
          autoFocus
        />
        <button type="submit" disabled={sending}>
          {sending ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
