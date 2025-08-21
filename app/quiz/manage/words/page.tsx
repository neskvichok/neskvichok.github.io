"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { addWordToSet, addWordsBulk, deleteWord, fetchSetWithWords, updateWord } from "@/lib/quiz-data/db";
import type { QuizSet } from "@/lib/quiz-data/types";
import { withBasePath } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

export default function ManageWordsPage() {
  const searchParams = useSearchParams();
  const setId = searchParams.get('setId');
  
  const [setDef, setSetDef] = useState<QuizSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [bulk, setBulk] = useState("");
  const [addingBulk, setAddingBulk] = useState(false);
  const [rowEdits, setRowEdits] = useState<Record<string, { hint: string; answersText: string; dirty: boolean; saving: boolean }>>({});
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  async function refresh() {
    if (!setId) return;
    setLoading(true);
    setSetDef(await fetchSetWithWords(setId));
    setLoading(false);
    // Ініціалізувати редагування для кожного слова
    const next: Record<string, { hint: string; answersText: string; dirty: boolean; saving: boolean }> = {};
    const data = await fetchSetWithWords(setId);
    if (data) {
      data.words.forEach(w => {
        next[w.id] = {
          hint: w.hint,
          answersText: (Array.isArray(w.answer) ? w.answer : [w.answer]).join(", "),
          dirty: false,
          saving: false,
        };
      });
    }
    setRowEdits(next);
  }

  useEffect(() => { 
    if (setId) {
      refresh(); 
    } else {
      setLoading(false);
    }
  }, [setId]);

  function parseLine(input: string): { hint: string; answers: string[] } | null {
    const raw = input.trim();
    if (!raw) return null;
    const [h, rest] = raw.split("-");
    const hint = (h || "").trim();
    const answers = (rest || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
    if (!hint || answers.length === 0) return null;
    return { hint, answers };
  }

  function parseBulk(input: string): Array<{ hint: string; answers: string[] }> {
    const lines = input.split(/\r?\n/);
    const items: Array<{ hint: string; answers: string[] }> = [];
    for (const l of lines) {
      const parsed = parseLine(l);
      if (parsed) items.push(parsed);
    }
    return items;
  }

  async function onAddBulkSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!setId) return;
    const items = parseBulk(bulk);
    if (!items.length) return;
    // Перевірка на дублікати
    const existingHints = setDef?.words.map(w => w.hint.toLowerCase()) || [];
    const newHints = items.map(i => i.hint.toLowerCase());
    const duplicates = newHints.filter(h => existingHints.includes(h));
    if (duplicates.length > 0) {
      setDuplicateWarning(`Дублікати підказок: ${duplicates.join(", ")}`);
      return;
    }
    setDuplicateWarning(null);
    setAddingBulk(true);
    try {
      await addWordsBulk(setId, items);
      setBulk("");
      await refresh();
    } catch (error) {
      console.error("Error adding words:", error);
      setDuplicateWarning(`Помилка додавання: ${error instanceof Error ? error.message : 'Невідома помилка'}`);
    } finally {
      setAddingBulk(false);
    }
  }

  async function onDelete(wordId: string) {
    if (!confirm("Видалити слово?")) return;
    await deleteWord(wordId);
    await refresh();
  }

  function onRowChange(id: string, field: "hint" | "answersText", value: string) {
    setRowEdits(prev => ({
      ...prev,
      [id]: { ...(prev[id] || { hint: "", answersText: "", dirty: false, saving: false }), [field]: value, dirty: true }
    }));
  }

  const hasDirty = Object.values(rowEdits).some(r => r.dirty);

  async function onSaveAll() {
    const entries = Object.entries(rowEdits).filter(([, r]) => r.dirty);
    if (!entries.length) return;
    // Валідація і підготовка
    const payloads = entries.map(([id, r]) => ({
      id,
      hint: r.hint.trim(),
      answers: r.answersText.split(",").map(s => s.trim()).filter(Boolean),
    })).filter(p => p.hint && p.answers.length);
    // Маркуємо saving
    setRowEdits(prev => entries.reduce((acc, [id]) => ({ ...acc, [id]: { ...prev[id], saving: true } }), prev));
    try {
      await Promise.all(payloads.map(p => updateWord(p.id, { hint: p.hint, answers: p.answers })));
      await refresh();
    } finally {
      // Скинути saving/dirty
      setRowEdits(prev => Object.fromEntries(Object.entries(prev).map(([id, r]) => [id, { ...r, saving: false, dirty: false }])));
    }
  }

  if (!setId) {
    return (
      <div className="container-nice py-6">
        <div className="card p-6 text-center">
          <h1 className="text-xl font-semibold mb-4">Виберіть набір</h1>
          <p className="text-gray-600 mb-4">Для редагування слів потрібно вибрати набір.</p>
          <Link className="btn btn-primary" href={withBasePath("/quiz/manage")}>
            До наборів
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-nice py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Слова набору</h1>
        <div className="flex gap-2 items-center">
          <Link className="btn btn-ghost" href={withBasePath("/quiz/manage")}>← До наборів</Link>
          <button className="btn btn-primary" disabled={!hasDirty} onClick={onSaveAll}>Зберегти зміни</button>
        </div>
      </div>
      <div className="card p-4 md:p-6">
        {loading ? (
          <div className="text-gray-600">Завантаження…</div>
        ) : !setDef ? (
          <div className="text-gray-600">Набір не знайдено.</div>
        ) : (
          <div className="grid gap-2">
            <div className="text-gray-700 font-medium mb-2">{setDef.name}</div>
            <form onSubmit={onAddBulkSubmit} className="grid gap-2 mb-4">
              {duplicateWarning && (
                <div className="text-red-600 text-sm">{duplicateWarning}</div>
              )}
              <textarea
                className="input min-h-[120px]"
                placeholder={"Кілька рядків у форматі:\ncat - кіт, котик\nto run - бігти, бігати"}
                value={bulk}
                onChange={(e) => setBulk(e.target.value)}
              />
              <div className="flex justify-end">
                <button className="btn btn-primary" disabled={addingBulk || parseBulk(bulk).length === 0}>
                  {addingBulk ? "Додавання…" : "Додати всі"}
                </button>
              </div>
            </form>
            <div className="hidden md:grid md:grid-cols-[1fr_1fr_auto] md:gap-2 text-xs text-gray-500 px-1">
              <div>Підказка (hint)</div>
              <div>Відповіді (через кому)</div>
              <div></div>
            </div>
            {setDef.words.map(w => {
              const edit = rowEdits[w.id] || { hint: w.hint, answersText: (Array.isArray(w.answer) ? w.answer : [w.answer]).join(", "), dirty: false, saving: false };
              return (
                <div key={w.id} className="grid md:grid-cols-[1fr_1fr_auto] gap-2 items-center text-sm">
                  <input className="input" value={edit.hint} onChange={(e) => onRowChange(w.id, "hint", e.target.value)} />
                  <input className="input" value={edit.answersText} onChange={(e) => onRowChange(w.id, "answersText", e.target.value)} />
                  <div className="flex gap-2 justify-end">
                    <button className="btn btn-ghost" onClick={() => onDelete(w.id)}>Видалити</button>
                  </div>
                </div>
              );
            })}
            {!setDef.words.length && <div className="text-gray-600">Поки немає слів.</div>}
          </div>
        )}
      </div>
    </div>
  );
}
