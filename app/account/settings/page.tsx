import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { LEARNED_THRESHOLD } from "@/lib/quiz-logic/shortMemory";

export default async function AccountSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="max-w-md mx-auto card p-6">
        <h1 className="text-xl font-semibold mb-2">Потрібна авторизація</h1>
        <p className="text-gray-600">Будь ласка, <Link className="underline" href="/auth/sign-in">увійдіть</Link>.</p>
      </div>
    );
  }

  // Дані для прогресу: набори (з кількістю слів), прогрес користувача, статистика по наборах
  const [{ data: sets }, { data: progressRows }, { data: statsRows }] = await Promise.all([
    supabase.from("sets").select("id, name, words:words(id)"),
    supabase.from("user_progress").select("set_id, short_memory").eq("uid", user.id),
    supabase.from("user_set_stats").select("set_id, attempts, correct").eq("uid", user.id),
  ]);

  const setIdToStats: Record<string, { attempts: number; correct: number }> = {};
  (statsRows || []).forEach((r: any) => { setIdToStats[r.set_id] = { attempts: r.attempts ?? 0, correct: r.correct ?? 0 }; });

  const groupedLearned: Record<string, number> = {};
  (progressRows || []).forEach((r: any) => {
    if ((r.short_memory ?? 0) > LEARNED_THRESHOLD) {
      groupedLearned[r.set_id] = (groupedLearned[r.set_id] || 0) + 1;
    }
  });

  return (
    <div className="max-w-2xl mx-auto card p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Налаштування акаунту</h1>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="text-gray-500">ID</div><div className="font-mono break-all">{user.id}</div>
          <div className="text-gray-500">Email</div><div>{user.email}</div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Прогрес</h2>
        <div className="grid gap-2">
          {(!sets || sets.length === 0) && (
            <div className="text-gray-600">Немає наборів.</div>
          )}
          {(sets || []).map((s: any) => {
            const total = (s.words || []).length;
            const learned = groupedLearned[s.id] || 0;
            const stats = setIdToStats[s.id] || { attempts: 0, correct: 0 };
            return (
              <div key={s.id} className="flex items-center justify-between border border-gray-200 rounded-xl p-3 text-sm">
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-gray-600">Вивчено: {learned}/{total}</div>
                </div>
                <div className="text-gray-700">
                  <span className="mr-3">Спроби: {stats.attempts}</span>
                  <span>Вірні: {stats.correct}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2">
        <Link className="btn btn-ghost" href="/quiz">До квізів</Link>
        <Link className="btn btn-ghost" href="/quiz/manage">Керувати наборами</Link>
      </div>
    </div>
  );
}


