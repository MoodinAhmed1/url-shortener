"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { resetPassword } from "@/lib/api"; // Make sure you have this

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!token) {
      setMessage("Token not found in URL.");
      return;
    }

    const res = await resetPassword(token, newPassword);
    setMessage(res.message || res.error);

    setTimeout(() => {
      if (res.message) {
        window.location.href = "/login";
      }
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-md">
        <h2 className="text-xl font-bold">Reset Your Password</h2>

        <input
          type="password"
          placeholder="New password"
          className="p-2 border rounded"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        <button type="submit" className="bg-green-600 text-white p-2 rounded">
          Set New Password
        </button>

        {message && <p className="text-center text-sm mt-2">{message}</p>}
      </form>
    </div>
  );
}
