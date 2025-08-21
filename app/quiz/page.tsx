"use client";
import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/quiz/Layout";
import { ModePicker } from "@/components/quiz/ModePicker";
import { MultiSetPicker } from "@/components/quiz/MultiSetPicker";
import type { QuizSet } from "@/lib/quiz-data/types";
import { EducationMode } from "@/components/quiz/modes/EducationMode";
import { addWordToSet, deleteWord, fetchSetsWithWords } from "@/lib/quiz-data/db";
import { combineSets } from "@/lib/quiz-data/combined-sets";

const MODES = {
  education: { name: "Education", component: EducationMode, status: "ready" },
};

export default function QuizHomePage() {
  const [sets, setSets] = useState<QuizSet[]>([]);
  const [selectedSetIds, setSelectedSetIds] = useState<string[]>([]);
  const [selectedMode, setSelectedMode] = useState<keyof typeof MODES>("education");
  const selectedSet = useMemo(() => combineSets(sets, selectedSetIds), [sets, selectedSetIds]);
  const SelectedModeComponent = MODES[selectedMode].component;

  useEffect(() => {
    (async () => {
      const fromDb = await fetchSetsWithWords();
      if (fromDb.length) {
        setSets(fromDb);
        setSelectedSetIds([fromDb[0]?.id].filter(Boolean) as string[]);
      }
    })();
  }, []);

  async function handleAddWord() {
    if (selectedSetIds.length !== 1) {
      alert("Для додавання слова виберіть тільки один набір");
      return;
    }
    const hint = prompt("Підказка слова (hint)")?.trim();
    if (!hint) return;
    const ans = prompt("Відповіді через кому")?.trim();
    if (!ans) return;
    await addWordToSet(selectedSetIds[0], hint, ans.split(",").map(s => s.trim()).filter(Boolean));
    const fromDb = await fetchSetsWithWords();
    setSets(fromDb);
  }

  async function handleDeleteWord(wordId: string) {
    if (!confirm("Видалити слово?")) return;
    await deleteWord(wordId);
    const fromDb = await fetchSetsWithWords();
    setSets(fromDb);
  }

  return (
    <Layout>
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 px-2 md:px-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Quiz Trainer</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full md:w-auto">
          <ModePicker modes={MODES} value={selectedMode} onChange={(v) => setSelectedMode(v as any)} />
          <a className="btn btn-ghost" href="/quiz/manage">Керувати наборами</a>
        </div>
      </header>

      <main className="mt-6 px-2 md:px-4">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          {/* Основний контент квізу */}
          <div className="lg:col-span-5">
            <div className="card p-4 md:p-6">
              {selectedSet ? (
                <SelectedModeComponent setDef={selectedSet} />
              ) : (
                <div className="text-gray-700">Виберіть хоча б один набір для початку квізу.</div>
              )}
            </div>
          </div>
          
          {/* Бічна панель з наборами */}
          <div className="lg:col-span-1">
            <div className="card p-4">
              <h3 className="text-lg font-semibold mb-4">Набори слів</h3>
              <MultiSetPicker 
                sets={sets} 
                selectedSetIds={selectedSetIds} 
                onChange={setSelectedSetIds} 
              />
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}


