"use client";
import { createClient } from "@/lib/supabase-client";

type ProgressMap = Record<string, { shortMemory?: number }>;
type SetStats = { attempts: number; correct: number };

export async function getSetProgress(userId: string | undefined | null, setId: string): Promise<ProgressMap> {
  if (!userId) {
    try { return JSON.parse(localStorage.getItem(`guest:progress:${setId}`) || "{}"); } catch { return {}; }
  }
  
  // Якщо це об'єднаний набір, обробляємо кожен набір окремо
  if (setId.startsWith("combined-")) {
    const setIds = setId.replace("combined-", "").split("-");
    const map: ProgressMap = {};
    
    for (const individualSetId of setIds) {
      // Пропускаємо короткі UUID (менше 32 символів)
      if (individualSetId.length < 32) {
        continue;
      }
      
      const supabase = createClient();
      const { data, error } = await supabase
        .from("user_progress")
        .select("word_id, short_memory")
        .eq("uid", userId)
        .eq("set_id", individualSetId);
      
      if (!error && data) {
        data.forEach((row: any) => {
          map[row.word_id] = { shortMemory: row.short_memory ?? 0 };
        });
      }
    }
    return map;
  }
  
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_progress")
    .select("word_id, short_memory")
    .eq("uid", userId)
    .eq("set_id", setId);
  if (error) {
    console.error("getSetProgress error", error);
    return {};
  }
  const map: ProgressMap = {};
  (data || []).forEach((row: any) => {
    map[row.word_id] = { shortMemory: row.short_memory ?? 0 };
  });
  return map;
}

export async function saveWordProgress(userId: string | undefined | null, setId: string, wordId: string, payload: { shortMemory?: number }) {
  if (!userId) {
    const key = `guest:progress:${setId}`;
    const cur = (() => { try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; } })();
    cur[wordId] = { ...(cur[wordId] || {}), ...payload };
    try { localStorage.setItem(key, JSON.stringify(cur)); } catch {}
    return;
  }
  
  // Для об'єднаних наборів зберігаємо в перший набір
  let targetSetId = setId;
  if (setId.startsWith("combined-")) {
    const setIds = setId.replace("combined-", "").split("-");
    // Знаходимо перший повний UUID
    const fullUuid = setIds.find(id => id.length >= 32);
    if (fullUuid) {
      targetSetId = fullUuid;
    } else {
      // Якщо немає повного UUID, не зберігаємо
      return;
    }
  }
  
  const supabase = createClient();
  const { error } = await supabase
    .from("user_progress")
    .upsert({
      uid: userId,
      set_id: targetSetId,
      word_id: wordId,
      short_memory: payload.shortMemory ?? 0,
    }, { onConflict: "uid,word_id" });
  if (error) {
    console.error("saveWordProgress error", error);
  }
}

export async function getSetStats(userId: string | undefined | null, setId: string): Promise<SetStats> {
  if (!userId) {
    try { return JSON.parse(localStorage.getItem(`guest:stats:${setId}`) || "{}"); } catch { return { attempts: 0, correct: 0 }; }
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_set_stats")
    .select("attempts, correct")
    .eq("uid", userId)
    .eq("set_id", setId)
    .maybeSingle();
  if (error || !data) return { attempts: 0, correct: 0 };
  return { attempts: data.attempts ?? 0, correct: data.correct ?? 0 };
}

export async function saveSetStats(userId: string | undefined | null, setId: string, stats: SetStats) {
  if (!userId) {
    try { localStorage.setItem(`guest:stats:${setId}`, JSON.stringify(stats)); } catch {}
    return;
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("user_set_stats")
    .upsert({ uid: userId, set_id: setId, attempts: stats.attempts, correct: stats.correct }, { onConflict: "uid,set_id" });
  if (error) {
    console.error("saveSetStats error", error);
  }
}


