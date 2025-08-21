"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase-client";
import SignOutButton from "./signout-button";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { withBasePath } from "@/lib/utils";

export default function AccountPage() {
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
      <div className="max-w-xl mx-auto card p-6">
        <div className="text-center">Завантаження...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto card p-6">
        <h1 className="text-xl font-semibold mb-2">Потрібна авторизація</h1>
        <p className="text-gray-600">Будь ласка, <Link className="underline" href={withBasePath("/auth/sign-in")}>увійдіть</Link> щоб побачити акаунт.</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto card p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Акаунт</h1>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="text-gray-500">ID</div><div className="font-mono">{user.id}</div>
        <div className="text-gray-500">Email</div><div>{user.email}</div>
      </div>
      <div className="flex gap-2">
        <Link className="btn btn-primary" href={withBasePath("/quiz")}>Перейти до квізів</Link>
        <Link className="btn btn-ghost" href={withBasePath("/quiz/manage")}>Керувати наборами</Link>
        <SignOutButton />
        <Link className="btn btn-ghost" href={withBasePath("/")}>На головну</Link>
      </div>
    </div>
  )
}
