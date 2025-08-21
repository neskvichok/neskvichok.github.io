"use client";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else router.push("/quiz");
  };

  return (
    <div className="max-w-md mx-auto card p-6">
      <h1 className="text-2xl font-semibold mb-4">Увійти</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="input" placeholder="Email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        <input className="input" placeholder="Пароль" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn btn-primary w-full" disabled={loading}>{loading ? "Зачекайте..." : "Увійти"}</button>
      </form>
      <div className="text-sm text-gray-600 mt-3">
        Немає акаунту? <Link href="/auth/sign-up" className="underline">Зареєструватися</Link>
      </div>
      <div className="text-sm text-gray-600 mt-1">
        <Link href="/auth/reset" className="underline">Забули пароль?</Link>
      </div>
    </div>
  )
}
