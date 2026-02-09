"use client";

import { useState } from "react";

type RequestRow = {
  id: string;
  email: string;
  message: string;
  status: string;
  created_at: string;
};

export function ApprovalsPanel({ initialRequests }: { initialRequests: RequestRow[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [actionMsg, setActionMsg] = useState("");

  const handleAction = async (id: string, status: "approved" | "rejected") => {
    setActionMsg("Processing...");
    const res = await fetch("/api/request-access", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    });
    const data = await res.json();
    setActionMsg(data.message || "Done");

    // Update local state
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
  };

  const pending = requests.filter((r) => r.status === "pending");
  const handled = requests.filter((r) => r.status !== "pending");

  return (
    <>
      {actionMsg && (
        <div className="panel" style={{ background: "#1a3a2a", marginTop: "1rem" }}>
          <p>{actionMsg}</p>
        </div>
      )}

      <div className="panel" style={{ marginTop: "1rem" }}>
        <h2>Pending requests ({pending.length})</h2>
        {pending.length === 0 && <p className="small">No pending requests.</p>}
        {pending.map((request) => (
          <div key={request.id} style={{ borderBottom: "1px solid var(--border)", padding: "0.75rem 0" }}>
            <strong>{request.email}</strong>
            <p className="small">{request.message || "(no message)"}</p>
            <p className="small">{new Date(request.created_at).toLocaleString()}</p>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
              <button onClick={() => handleAction(request.id, "approved")}>
                Approve &amp; send invite
              </button>
              <button
                onClick={() => handleAction(request.id, "rejected")}
                className="btn-logout"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      {handled.length > 0 && (
        <div className="panel" style={{ marginTop: "1rem" }}>
          <h2>Handled</h2>
          {handled.map((request) => (
            <div key={request.id} style={{ borderBottom: "1px solid var(--border)", padding: "0.5rem 0" }}>
              <strong>{request.email}</strong>{" "}
              <span style={{ color: request.status === "approved" ? "var(--accent)" : "#e74c3c" }}>
                {request.status}
              </span>
              <p className="small">{new Date(request.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
