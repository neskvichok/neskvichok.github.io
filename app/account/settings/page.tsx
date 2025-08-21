"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import Link from "next/link";
import { LEARNED_THRESHOLD } from "@/lib/quiz-logic/shortMemory";
import type { User } from "@supabase/supabase-js";
import { withBasePath } from "@/lib/utils";

interface Set {
  id: string;
  name: string;
  words: { id: string }[];
}

interface ProgressRow {
  set_id: string;
  short_memory: number;
}



export default function AccountSettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [sets, setSets] = useState<Set[]>([]);
  const [progressRows, setProgressRows] = useState<ProgressRow[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    // Get user session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        setLoading(false);
        return;
      }
      
      setUser(session.user);
      
      // Fetch data
      Promise.all([
        supabase.from("sets").select("id, name, words:words(id)"),
        supabase.from("user_progress").select("set_id, short_memory").eq("uid", session.user.id),
      ]).then(([setsResult, progressResult]) => {
        setSets(setsResult.data || []);
        setProgressRows(progressResult.data || []);
        setLoading(false);
      });
    });
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto card p-6">
        <div className="text-center">Завантаження...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto card p-6">
        <h1 className="text-xl font-semibold mb-2">Потрібна авторизація</h1>
        <p className="text-gray-600">Будь ласка, <Link className="underline" href={withBasePath("/auth/sign-in")}>увійдіть</Link>.</p>
      </div>
    );
  }



  const groupedLearned: Record<string, number> = {};
  progressRows.forEach((r) => {
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
          {sets.length === 0 && (
            <div className="text-gray-600">Немає наборів.</div>
          )}
          {sets.map((s) => {
            const total = s.words.length;
            const learned = groupedLearned[s.id] || 0;
            return (
              <div key={s.id} className="flex items-center justify-between border border-gray-200 rounded-xl p-3 text-sm">
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-gray-600">Вивчено: {learned}/{total}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2">
        <Link className="btn btn-ghost" href={withBasePath("/quiz")}>До квізів</Link>
        <Link className="btn btn-ghost" href={withBasePath("/quiz/manage")}>Керувати наборами</Link>
      </div>
    </div>
  );
}


