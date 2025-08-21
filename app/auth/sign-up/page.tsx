"use client";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignUpPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else router.push("/quiz");
  };

  return (
    <div className="max-w-md mx-auto card p-6">
      <h1 className="text-2xl font-semibold mb-4">Реєстрація</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="input" placeholder="Email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        <input className="input" placeholder="Пароль (мін. 6 символів)" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn btn-primary w-full" disabled={loading}>{loading ? "Зачекайте..." : "Створити акаунт"}</button>
      </form>
      <div className="text-sm text-gray-600 mt-3">
        Вже маєте акаунт? <Link href="/auth/sign-in" className="underline">Увійти</Link>
      </div>
    </div>
  )
}
