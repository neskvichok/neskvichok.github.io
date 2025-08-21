import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";


export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/auth/sign-in");
  return (
    <div className="card p-6">
      <h1 className="text-2xl font-semibold mb-2">Захищена сторінка</h1>
      <p className="text-gray-600">Ви авторизовані 🎉</p>
    </div>
  )
}
