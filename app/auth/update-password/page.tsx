"use client";
import { createClient } from "@/lib/supabase-client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UpdatePasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message);
    else router.push("/account");
  };

  return (
    <div className="max-w-md mx-auto card p-6">
      <h1 className="text-2xl font-semibold mb-4">Новий пароль</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="input" placeholder="Новий пароль" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn btn-primary w-full">Оновити</button>
      </form>
    </div>
  )
}
