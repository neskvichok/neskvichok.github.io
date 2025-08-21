import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import SignOutButton from "./signout-button";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="max-w-md mx-auto card p-6">
        <h1 className="text-xl font-semibold mb-2">Потрібна авторизація</h1>
        <p className="text-gray-600">Будь ласка, <Link className="underline" href="/auth/sign-in">увійдіть</Link> щоб побачити акаунт.</p>
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
        <Link className="btn btn-primary" href="/quiz">Перейти до квізів</Link>
        <Link className="btn btn-ghost" href="/quiz/manage">Керувати наборами</Link>
        <SignOutButton />
        <Link className="btn btn-ghost" href="/">На головну</Link>
      </div>
    </div>
  )
}
