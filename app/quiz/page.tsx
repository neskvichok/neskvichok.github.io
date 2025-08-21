"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Layout } from "@/components/quiz/Layout";
import { ModePicker } from "@/components/quiz/ModePicker";
import { MultiSetPicker } from "@/components/quiz/MultiSetPicker";
import type { QuizSet } from "@/lib/quiz-data/types";
import { EducationMode } from "@/components/quiz/modes/EducationMode";
import { AccuracyMode } from "@/components/quiz/modes/AccuracyMode";
import { SpeedMode } from "@/components/quiz/modes/SpeedMode";
import { addWordToSet, deleteWord, fetchSetsWithWords } from "@/lib/quiz-data/db";
import { combineSets, createAllWordsSet } from "@/lib/quiz-data/combined-sets";
import { withBasePath } from "@/lib/utils";

const MODES = {
  education: { name: "Навчання", component: EducationMode, status: "ready" },
  accuracy: { name: "Точність", component: AccuracyMode, status: "ready" },
  speed: { name: "Швидкість", component: SpeedMode, status: "ready" },
};

export default function QuizHomePage() {
  const [sets, setSets] = useState<QuizSet[]>([]);
  const [selectedSetIds, setSelectedSetIds] = useState<string[]>([]);
  const [selectedMode, setSelectedMode] = useState<keyof typeof MODES>("education");
  
  // Обмежуємо вибір наборів при зміні режиму
  const handleModeChange = (mode: keyof typeof MODES) => {
    setSelectedMode(mode);
    
    // Якщо переключаємося на Accuracy або Speed і вибрано більше одного набору
    if ((mode === "accuracy" || mode === "speed") && selectedSetIds.length > 1) {
      // Залишаємо тільки перший вибраний набір або "Всі слова"
      const firstSetId = selectedSetIds.find(id => id === 'all-words-combined') || selectedSetIds[0];
      setSelectedSetIds([firstSetId]);
    }
  };
  const [isGameActive, setIsGameActive] = useState(false);
 
  const selectedSet = useMemo(() => {
    // Для режимів Accuracy і Speed обмежуємо вибір до одного набору
    if (selectedMode === "accuracy" || selectedMode === "speed") {
      if (selectedSetIds.includes('all-words-combined')) {
        return createAllWordsSet(sets);
      } else if (selectedSetIds.length > 1) {
        // Якщо вибрано більше одного набору, беремо тільки перший
        const firstSetId = selectedSetIds[0];
        return combineSets(sets, [firstSetId]);
      } else if (selectedSetIds.length === 1) {
        return combineSets(sets, selectedSetIds);
      }
    } else {
      // Для режиму Education дозволяємо множинний вибір
      if (selectedSetIds.includes('all-words-combined')) {
        return createAllWordsSet(sets);
      }
      return combineSets(sets, selectedSetIds);
    }
    return null;
  }, [sets, selectedSetIds, selectedMode]);
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
      <header className="pl-0 pr-2 md:pr-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Quiz Trainer</h1>
          <Link className="btn btn-ghost text-sm" href={withBasePath("/account")}>
            📊 Мій профіль
          </Link>
        </div>
      </header>

      <main className="mt-2 pl-0 pr-2 md:pr-4">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Основний контент квізу */}
          <div className="flex-1">
            <div className="card p-4 md:p-6">
              {selectedSet ? (
                <SelectedModeComponent 
                  setDef={selectedSet} 
                  onGameStateChange={selectedMode === "accuracy" || selectedMode === "speed" ? setIsGameActive : undefined}
                />
              ) : (
                <div className="text-gray-700">Виберіть хоча б один набір для початку квізу.</div>
              )}
            </div>
          </div>
          
          {/* Бічна панель з наборами */}
          {!isGameActive && (
            <div className="lg:w-80">
              <div className="card p-4 mb-4">
                <ModePicker modes={MODES} value={selectedMode} onChange={(v) => handleModeChange(v as any)} />
              </div>
              <div className="card p-4">
                <h3 className="text-lg font-semibold mb-4">Набори слів</h3>
                {(selectedMode === "accuracy" || selectedMode === "speed") && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      💡 Для режимів <strong>{selectedMode === "accuracy" ? "Точність" : "Швидкість"}</strong> можна вибрати тільки один набір або "Всі слова"
                    </p>
                  </div>
                )}
                <MultiSetPicker 
                  sets={sets} 
                  selectedSetIds={selectedSetIds} 
                  onChange={setSelectedSetIds}
                  mode={selectedMode}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
}


