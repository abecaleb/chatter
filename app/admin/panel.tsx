"use client";

type RequestRow = {
  id: string;
  email: string;
  message: string;
  status: string;
  created_at: string;
};

export function ApprovalsPanel({ initialRequests }: { initialRequests: RequestRow[] }) {
  const approve = async (id: string) => {
    await fetch("/api/request-access", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "approved" })
    });
    window.location.reload();
  };

  return (
    <div className="panel">
      {initialRequests.map((request) => (
        <div key={request.id} style={{ borderBottom: "1px solid #30363d", padding: "0.65rem 0" }}>
          <strong>{request.email}</strong> - <span>{request.status}</span>
          <p>{request.message || "(no message)"}</p>
          {request.status === "pending" ? <button onClick={() => approve(request.id)}>Approve</button> : null}
        </div>
      ))}
    </div>
  );
}
