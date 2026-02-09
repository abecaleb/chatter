"use client";

export function PendingApproval({ email }: { email: string }) {
  const logout = async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <div className="landing">
      <h1>Chatter</h1>
      <div className="panel">
        <h2>Waiting for approval</h2>
        <p className="small">
          Signed in as <strong>{email}</strong>
        </p>
        <p className="small" style={{ marginTop: "0.75rem" }}>
          Bruce hasn&apos;t approved your access yet. Hang tight or ask him to check the admin panel.
        </p>
        <div style={{ marginTop: "1rem" }}>
          <button onClick={logout} className="btn-logout">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
