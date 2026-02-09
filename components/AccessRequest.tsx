"use client";

import { useState } from "react";

export function AccessRequest() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  const submit = async () => {
    setStatus("Submitting...");
    const res = await fetch("/api/request-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, message })
    });
    const data = await res.json();
    setStatus(data.message || "Done");
  };

  return (
    <div className="panel">
      <h2>Request access</h2>
      <div className="row">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your email" />
      </div>
      <textarea
        style={{ width: "100%", marginTop: 8, minHeight: 75 }}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Tell Bruce why you should join"
      />
      <div style={{ marginTop: 8 }}>
        <button onClick={submit}>Email request</button>
      </div>
      {status ? <p className="small">{status}</p> : null}
    </div>
  );
}
