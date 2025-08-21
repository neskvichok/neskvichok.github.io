"use client";
import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/quiz/Layout";
import { ModePicker } from "@/components/quiz/ModePicker";
import { SetPicker } from "@/components/quiz/SetPicker";
import type { QuizSet } from "@/lib/quiz-data/types";
import { EducationMode } from "@/components/quiz/modes/EducationMode";
import { addWordToSet, deleteWord, fetchSetsWithWords } from "@/lib/quiz-data/db";

const MODES = {
  education: { name: "Education", component: EducationMode, status: "ready" },
};

export default function QuizHomePage() {
  const [sets, setSets] = useState<QuizSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string | undefined>(undefined);
  const [selectedMode, setSelectedMode] = useState<keyof typeof MODES>("education");
  const selectedSet = sets.find((s) => s.id === selectedSetId);
  const SelectedModeComponent = MODES[selectedMode].component;

  useEffect(() => {
    (async () => {
      const fromDb = await fetchSetsWithWords();
      if (fromDb.length) {
        setSets(fromDb);
        setSelectedSetId(fromDb[0]?.id);
      }
    })();
  }, []);

  async function handleAddWord() {
    const hint = prompt("Підказка слова (hint)")?.trim();
    if (!hint) return;
    const ans = prompt("Відповіді через кому")?.trim();
    if (!ans) return;
    await addWordToSet(selectedSetId!, hint, ans.split(",").map(s => s.trim()).filter(Boolean));
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
      <header className="container-nice flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Quiz Trainer</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full md:w-auto">
          <SetPicker sets={sets} value={selectedSetId} onChange={setSelectedSetId} />
          <ModePicker modes={MODES} value={selectedMode} onChange={(v) => setSelectedMode(v as any)} />
          <a className="btn btn-ghost" href="/quiz/manage">Керувати наборами</a>
        </div>
      </header>

      <main className="container-nice mt-6">
        <div className="card p-4 md:p-6">
          {selectedSet ? (
            <SelectedModeComponent setDef={selectedSet} />
          ) : (
            <div className="text-gray-700">Немає вибраного набору. Створіть або оберіть набір.</div>
          )}
        </div>
      </main>
    </Layout>
  );
}


