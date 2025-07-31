import React from "react";

export default function VerifyPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ padding: "2rem", border: "1px solid #e5e7eb", borderRadius: "8px", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Verify Your Account</h1>
        <p>Please check your email for a verification link to activate your account.</p>
      </div>
    </div>
  );
}