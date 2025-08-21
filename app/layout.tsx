import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import SignOutButton from "@/app/account/signout-button";

export const metadata: Metadata = {
  title: "Quiz Trainer Next + Supabase",
  description: "Styled like your React app, with Supabase auth."
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <html lang="uk">
      <body>
        <nav className="bg-white border-b border-gray-200">
          <div className="container-nice flex h-14 items-center justify-between">
            <Link href="/" className="font-semibold">QuizTrainer</Link>
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <Link className="btn btn-ghost" href="/quiz">Квізи</Link>
                  <Link href="/account/settings" aria-label="Налаштування акаунту" className="w-8 h-8 rounded-full bg-black text-white grid place-items-center">
                    {(user.email?.[0] || 'A').toUpperCase()}
                  </Link>
                  <SignOutButton />
                </>
              ) : (
                <>
                  <Link className="btn btn-ghost" href="/auth/sign-in">Увійти</Link>
                  <Link className="btn btn-primary" href="/auth/sign-up">Реєстрація</Link>
                </>
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
