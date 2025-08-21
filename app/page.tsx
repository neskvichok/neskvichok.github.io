import Link from "next/link";
import { createClient } from "@/lib/supabase-server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <div className="card p-8 text-center">
      <h1 className="text-3xl font-semibold mb-2">Ласкаво просимо 🎉</h1>
      <p className="text-gray-600 mb-6">Переходьте до тренування слів або керуйте своїми наборами.</p>
      <div className="flex justify-center gap-3">
        {user ? (
          <>
            <Link className="btn btn-primary" href="/quiz">Почати квіз</Link>
            <Link className="btn btn-ghost" href="/quiz/manage">Керувати наборами</Link>
          </>
        ) : (
          <>
            <Link className="btn btn-primary" href="/auth/sign-in">Увійти</Link>
            <Link className="btn btn-ghost" href="/auth/sign-up">Реєстрація</Link>
          </>
        )}
      </div>
    </div>
  );
}
