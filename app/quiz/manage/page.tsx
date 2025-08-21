"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createSet, deleteSet, fetchSets, renameSet } from "@/lib/quiz-data/db";
import { withBasePath } from "@/lib/utils";

export default function ManageSetsPage() {
  const [sets, setSets] = useState<Array<{ id: string; name: string }>>([]);
  const [newSetName, setNewSetName] = useState("");
  const [creating, setCreating] = useState(false);

  async function refresh() {
    setSets(await fetchSets());
  }

  useEffect(() => { refresh(); }, []);

  async function onCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = newSetName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await createSet(name);
      setNewSetName("");
      await refresh();
    } finally {
      setCreating(false);
    }
  }

  async function onRename(id: string, old: string) {
    const name = prompt("Нова назва?", old)?.trim();
    if (!name || name === old) return;
    await renameSet(id, name);
    await refresh();
  }

  async function onDelete(id: string) {
    if (!confirm("Видалити набір разом зі словами?")) return;
    await deleteSet(id);
    await refresh();
  }

  return (
    <div className="container-nice py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Керування наборами</h1>
        <form onSubmit={onCreateSubmit} className="flex items-center gap-2">
          <input
            className="input"
            placeholder="Назва нового набору"
            value={newSetName}
            onChange={(e) => setNewSetName(e.target.value)}
          />
          <button className="btn btn-primary" disabled={creating || !newSetName.trim()}>
            {creating ? "Створення…" : "Створити"}
          </button>
        </form>
      </div>
      <div className="card p-4 md:p-6">
        <div className="grid gap-2">
          {sets.map(s => (
            <div key={s.id} className="flex items-center justify-between">
              <div className="font-medium">{s.name}</div>
              <div className="flex gap-2">
                <Link className="btn btn-ghost" href={withBasePath(`/quiz/manage/words?setId=${s.id}`)}>Редагувати слова</Link>
                <button className="btn btn-ghost" onClick={() => onRename(s.id, s.name)}>Перейменувати</button>
                <button className="btn btn-ghost" onClick={() => onDelete(s.id)}>Видалити</button>
              </div>
            </div>
          ))}
          {!sets.length && <div className="text-gray-600">Немає наборів. Створіть перший.</div>}
        </div>
      </div>
    </div>
  );
}


