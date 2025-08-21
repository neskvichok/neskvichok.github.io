"use client";
import { createClient } from "@/lib/supabase-client";
import { useState } from "react";

export default function ResetPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: location.origin + "/auth/update-password" });
    if (error) setError(error.message);
    else setSent(true);
  };

  return (
    <div className="max-w-md mx-auto card p-6">
      <h1 className="text-2xl font-semibold mb-4">Відновлення паролю</h1>
      {sent ? (
        <div>Перевірте вашу пошту для подальших інструкцій.</div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <input className="input" placeholder="Email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button className="btn btn-primary w-full">Надіслати лист</button>
        </form>
      )}
    </div>
  )
}
