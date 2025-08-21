"use client";

import "./globals.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import SignOutButton from "@/app/account/signout-button";
import type { User } from "@supabase/supabase-js";
import { withBasePath } from "@/lib/utils";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const supabase = createClient();
      
      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
    } catch (error) {
      setLoading(false);
    }
  }, []);

  return (
    <html lang="uk">
      <head>
        <title>Quiz Trainer - Інтерактивний Тренажер Слів</title>
        <meta name="description" content="Сучасний веб-додаток для вивчення іноземних слів з використанням інтерактивних квізів" />
      </head>
      <body>
        <nav className="bg-white border-b border-gray-200">
          <div className="container-nice flex h-14 items-center justify-between">
            <Link href={withBasePath("/")} className="font-semibold">QuizTrainer</Link>
            <div className="flex items-center gap-2">
              {!loading && (
                user ? (
                  <>
                    <Link className="btn btn-ghost" href={withBasePath("/quiz")}>Квізи</Link>
                    <Link className="btn btn-ghost" href={withBasePath("/quiz/manage")}>Керувати наборами</Link>
                    <Link href={withBasePath("/account/settings")} aria-label="Налаштування акаунту" className="w-8 h-8 rounded-full bg-black text-white grid place-items-center">
                      {(user.email?.[0] || 'A').toUpperCase()}
                    </Link>
                    <SignOutButton />
                  </>
                ) : (
                  <>
                    <Link className="btn btn-ghost" href={withBasePath("/auth/sign-in")}>Увійти</Link>
                    <Link className="btn btn-primary" href={withBasePath("/auth/sign-up")}>Реєстрація</Link>
                  </>
                )
              )}
            </div>
          </div>
        </nav>
        <main className="container-nice py-8">{children}</main>
        <footer className="container-nice py-10 text-sm text-gray-500">© {new Date().getFullYear()} QuizTrainer</footer>
      </body>
    </html>
  );
}
