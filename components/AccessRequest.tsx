"use client";

import { useState } from "react";

export function AccessRequest() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!email.trim()) return;
    setStatus("Submitting...");
    const res = await fetch("/api/request-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), message })
    });
    const data = await res.json();
    setStatus(data.message || "Done");
    setSent(true);
  };

  return (
    <div className="panel">
      <h2>Step 1: Request access</h2>
      <p className="small">Enter your email and a message. Bruce will approve you and you&apos;ll get a login link by email.</p>
      <div className="row" style={{ marginTop: 8 }}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your email"
          type="email"
          disabled={sent}
        />
      </div>
      <textarea
        style={{ width: "100%", marginTop: 8, minHeight: 75 }}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Tell Bruce why you should join"
        disabled={sent}
      />
      <div style={{ marginTop: 8 }}>
        <button onClick={submit} disabled={sent || !email.trim()}>
          {sent ? "Sent!" : "Request access"}
        </button>
      </div>
      {status ? <p className="small">{status}</p> : null}
    </div>
  );
}
