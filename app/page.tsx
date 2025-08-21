"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase-client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { withBasePath } from "@/lib/utils";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="card p-8 text-center">
        <div className="text-lg">Завантаження...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Заголовок */}
      <div className="card p-8 text-center">
        <h1 className="text-4xl font-bold mb-4">QuizTrainer 🎯</h1>
        <p className="text-xl text-gray-600 mb-6">Інтерактивний тренажер для вивчення іноземних слів</p>
        <div className="flex justify-center gap-3">
          {user ? (
            <>
              <Link className="btn btn-primary" href={withBasePath("/quiz")}>Почати квіз</Link>
              <Link className="btn btn-ghost" href={withBasePath("/quiz/manage")}>Керувати наборами</Link>
              <Link className="btn btn-ghost" href={withBasePath("/account")}>Мій профіль</Link>
            </>
          ) : (
            <>
              <Link className="btn btn-primary" href={withBasePath("/auth/sign-in")}>Увійти</Link>
              <Link className="btn btn-ghost" href={withBasePath("/auth/sign-up")}>Реєстрація</Link>
            </>
          )}
        </div>
      </div>

      {/* Опис сайту */}
      <div className="card p-6">
        <h2 className="text-2xl font-semibold mb-4">Про QuizTrainer</h2>
        <p className="text-gray-600 mb-4">
          QuizTrainer - це сучасний веб-додаток для ефективного вивчення іноземних слів. 
          Використовуючи інтерактивні квізи та адаптивну систему повторень, 
          ви можете швидко та результативно розширити свій словниковий запас.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl mb-2">📚</div>
            <h3 className="font-semibold mb-2">Персоналізовані набори</h3>
            <p className="text-sm text-gray-600">Створюйте власні набори слів або використовуйте готові</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="font-semibold mb-2">Три режими тренування</h3>
            <p className="text-sm text-gray-600">Навчання, точність та швидкість для різних цілей</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-semibold mb-2">Детальна статистика</h3>
            <p className="text-sm text-gray-600">Відстежуйте свій прогрес та досягнення</p>
          </div>
        </div>
      </div>

      {/* Опис режимів */}
      <div className="card p-6">
        <h2 className="text-2xl font-semibold mb-4">Режими тренування</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Режим навчання */}
          <div className="border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">📖</div>
              <h3 className="text-xl font-semibold">Режим «Навчання»</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Ідеальний для початківців та систематичного вивчення слів. 
              Система адаптивних повторень допомагає закріпити слова в пам'яті.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Без обмежень за часом</li>
              <li>• Адаптивні повторення</li>
              <li>• Фокус на закріпленні</li>
              <li>• Відстеження прогресу</li>
            </ul>
          </div>

          {/* Режим точності */}
          <div className="border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">🎯</div>
              <h3 className="text-xl font-semibold">Режим «Точність»</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Тренуйте уважність та правильність введення. 
              За 4 хвилини потрібно правильно ввести всі 20 слів з набору.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 20 слів за 4 хвилини</li>
              <li>• Фіксований набір слів</li>
              <li>• Рахується точність</li>
              <li>• Можна пропускати слова</li>
            </ul>
          </div>

          {/* Режим швидкості */}
          <div className="border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">⚡</div>
              <h3 className="text-xl font-semibold">Режим «Швидкість»</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Розвивайте швидкість набору та реакцію. 
              За 4 хвилини введіть якнайбільшу кількість слів правильно.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 4 хвилини на гру</li>
              <li>• Випадкові слова</li>
              <li>• Рахується кількість</li>
              <li>• Без повторень</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Опис статистики */}
      <div className="card p-6">
        <h2 className="text-2xl font-semibold mb-4">Статистика та досягнення</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">📊 Детальна статистика</h3>
            <ul className="text-gray-600 space-y-2">
              <li>• <strong>По наборах:</strong> Найкращі результати для кожного набору окремо</li>
              <li>• <strong>Режим точності:</strong> Кількість правильних слів або час при 20/20</li>
              <li>• <strong>Режим швидкості:</strong> Кількість слів за 4 хвилини</li>
              <li>• <strong>Навчання:</strong> Кількість вивчених слів з прогресу</li>
              <li>• <strong>Прогрес-бари:</strong> Візуальне відображення досягнень</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">🏆 Система досягнень</h3>
            <ul className="text-gray-600 space-y-2">
              <li>• <strong>Словник:</strong> За вивчення 100+ слів</li>
              <li>• <strong>Снайпер:</strong> За точність 90%+ в режимі точності</li>
              <li>• <strong>Швидкість:</strong> За 30+ слів/хв в режимі швидкості</li>
              <li>• <strong>Гравець:</strong> За 10+ зіграних ігор</li>
              <li>• <strong>Персональні рекорди:</strong> Відстеження найкращих результатів</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Як почати */}
      <div className="card p-6">
        <h2 className="text-2xl font-semibold mb-4">Як почати?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4">
            <div className="text-3xl mb-3">1️⃣</div>
            <h3 className="font-semibold mb-2">Зареєструйтесь</h3>
            <p className="text-sm text-gray-600">Створіть акаунт для збереження прогресу</p>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl mb-3">2️⃣</div>
            <h3 className="font-semibold mb-2">Створіть набори</h3>
            <p className="text-sm text-gray-600">Додайте слова, які хочете вивчити</p>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl mb-3">3️⃣</div>
            <h3 className="font-semibold mb-2">Тренуйтесь</h3>
            <p className="text-sm text-gray-600">Виберіть режим та почніть тренування</p>
          </div>
        </div>
        {!user && (
          <div className="text-center mt-6">
            <Link className="btn btn-primary btn-lg" href={withBasePath("/auth/sign-up")}>
              Почати зараз
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
