"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase-client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { withBasePath } from "@/lib/utils";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="card p-8 text-center">
        <div className="text-lg">Завантаження...</div>
      </div>
    );
  }

  return (
    <div className="card p-8 text-center">
      <h1 className="text-3xl font-semibold mb-2">Ласкаво просимо 🎉</h1>
      <p className="text-gray-600 mb-6">Переходьте до тренування слів або керуйте своїми наборами.</p>
      <div className="flex justify-center gap-3">
        {user ? (
          <>
            <Link className="btn btn-primary" href={withBasePath("/quiz")}>Почати квіз</Link>
            <Link className="btn btn-ghost" href={withBasePath("/quiz/manage")}>Керувати наборами</Link>
          </>
        ) : (
          <>
            <Link className="btn btn-primary" href={withBasePath("/auth/sign-in")}>Увійти</Link>
            <Link className="btn btn-ghost" href={withBasePath("/auth/sign-up")}>Реєстрація</Link>
          </>
        )}
      </div>
    </div>
  );
}
