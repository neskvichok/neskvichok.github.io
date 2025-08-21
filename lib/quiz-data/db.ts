"use client";
import { createClient } from "@/lib/supabase-client";
import type { QuizSet, QuizWord } from "@/lib/quiz-data/types";

function mapDbWord(row: any): QuizWord {
  return {
    id: row.id,
    hint: row.hint,
    answer: Array.isArray(row.answers) ? row.answers : (typeof row.answers === "string" ? [row.answers] : []),
    shortMemory: 0,
  };
}

export async function fetchSetsWithWords(): Promise<QuizSet[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sets")
    .select("id, name, words:words(id, hint, answers)")
    .order("name", { ascending: true });
  if (error) return [];
  return (data || []).map((s: any) => ({
    id: s.id,
    name: s.name,
    words: (s.words || []).map(mapDbWord),
  }));
}

export async function fetchSets(): Promise<Array<{ id: string; name: string }>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sets")
    .select("id, name")
    .order("name", { ascending: true });
  if (error) return [];
  return data as Array<{ id: string; name: string }>;
}

export async function fetchSetWithWords(setId: string): Promise<QuizSet | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sets")
    .select("id, name, words:words(id, hint, answers)")
    .eq("id", setId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    words: (data.words || []).map(mapDbWord),
  };
}

export async function addWordToSet(setId: string, hint: string, answers: string[]) {
  const supabase = createClient();
  const { data, error } = await supabase.from("words").insert({ 
    set_id: setId, 
    hint, 
    answers: answers // Supabase автоматично конвертує string[] в jsonb
  });
  
  if (error) {
    console.error("Error adding word:", error);
    throw error;
  }
  
  return data;
}

export async function addWordsBulk(setId: string, items: Array<{ hint: string; answers: string[] }>) {
  if (!items.length) return;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("words")
    .insert(items.map(i => ({ 
      set_id: setId, 
      hint: i.hint, 
      answers: i.answers // Supabase автоматично конвертує string[] в jsonb
    })));
  
  if (error) {
    console.error("Error adding words bulk:", error);
    throw error;
  }
  
  return data;
}

export async function deleteWord(wordId: string) {
  const supabase = createClient();
  await supabase.from("words").delete().eq("id", wordId);
}

export async function createSet(name: string) {
  const supabase = createClient();
  await supabase.from("sets").insert({ name });
}

export async function renameSet(id: string, name: string) {
  const supabase = createClient();
  await supabase.from("sets").update({ name }).eq("id", id);
}

export async function deleteSet(id: string) {
  const supabase = createClient();
  await supabase.from("sets").delete().eq("id", id);
}

export async function updateWord(wordId: string, payload: { hint?: string; answers?: string[] }) {
  const supabase = createClient();
  const { data, error } = await supabase.from("words").update(payload).eq("id", wordId);
  
  if (error) {
    console.error("Error updating word:", error);
    throw error;
  }
  
  return data;
}


