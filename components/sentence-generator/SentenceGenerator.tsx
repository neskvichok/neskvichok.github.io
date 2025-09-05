"use client";

import { useState, useEffect } from 'react';
import { SentenceGenerator } from '@/lib/sentence-generator/generator';
import type { GeneratedSentence, SentenceGeneratorConfig } from '@/lib/sentence-generator/types';

interface SentenceGeneratorProps {
  onSentencesGenerated?: (sentences: GeneratedSentence[]) => void;
}

export function SentenceGeneratorComponent({ onSentencesGenerated }: SentenceGeneratorProps) {
  const [generator] = useState(() => new SentenceGenerator());
  const [config, setConfig] = useState<SentenceGeneratorConfig>({
    language: 'en',
    difficulty: 'beginner',
    categories: [],
    maxSentences: 10
  });
  const [sentences, setSentences] = useState<GeneratedSentence[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableDifficulties, setAvailableDifficulties] = useState<string[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);

  useEffect(() => {
    setAvailableCategories(generator.getCategories());
    setAvailableDifficulties(generator.getDifficultyLevels());
    setAvailableLanguages(generator.getLanguages());
  }, [generator]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const newSentences = generator.generateSentences(config);
      setSentences(newSentences);
      onSentencesGenerated?.(newSentences);
    } catch (error) {
      console.error('Error generating sentences:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCategoryToggle = (category: string) => {
    setConfig(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleLanguageChange = (language: 'uk' | 'en') => {
    setConfig(prev => ({ ...prev, language }));
  };

  const handleDifficultyChange = (difficulty: 'beginner' | 'intermediate' | 'advanced') => {
    setConfig(prev => ({ ...prev, difficulty }));
  };

  const handleMaxSentencesChange = (maxSentences: number) => {
    setConfig(prev => ({ ...prev, maxSentences: Math.max(1, Math.min(50, maxSentences)) }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🎲 Генератор речень</h1>
        <p className="text-gray-600">
          Генеруйте речення для тренування слів з різними рівнями складності
        </p>
      </div>

      {/* Налаштування */}
      <div className="card p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">⚙️ Налаштування генерації</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Мова */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Мова
            </label>
            <select
              value={config.language}
              onChange={(e) => handleLanguageChange(e.target.value as 'uk' | 'en')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableLanguages.map(lang => (
                <option key={lang} value={lang}>
                  {lang === 'en' ? '🇺🇸 Англійська' : '🇺🇦 Українська'}
                </option>
              ))}
            </select>
          </div>

          {/* Рівень складності */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Рівень складності
            </label>
            <select
              value={config.difficulty}
              onChange={(e) => handleDifficultyChange(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableDifficulties.map(difficulty => (
                <option key={difficulty} value={difficulty}>
                  {difficulty === 'beginner' ? '🟢 Початківець' : 
                   difficulty === 'intermediate' ? '🟡 Середній' : '🔴 Просунутий'}
                </option>
              ))}
            </select>
          </div>

          {/* Кількість речень */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Кількість речень
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={config.maxSentences}
              onChange={(e) => handleMaxSentencesChange(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Кнопка генерації */}
          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full btn btn-primary"
            >
              {isGenerating ? '🔄 Генеруємо...' : '🎲 Згенерувати'}
            </button>
          </div>
        </div>

        {/* Категорії */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Категорії (залиште порожнім для всіх)
          </label>
          <div className="flex flex-wrap gap-2">
            {availableCategories.map(category => (
              <button
                key={category}
                onClick={() => handleCategoryToggle(category)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  config.categories.includes(category)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Згенеровані речення */}
      {sentences.length > 0 && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">
            📝 Згенеровані речення ({sentences.length})
          </h2>
          
          <div className="space-y-4">
            {sentences.map((sentence, index) => (
              <div key={sentence.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1">
                    <div className="mb-2">
                      <div className="text-lg font-medium text-gray-800 mb-1">
                        {sentence.original}
                      </div>
                      <div className="text-gray-600">
                        {sentence.translation}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="bg-gray-100 px-2 py-1 rounded-full">
                        {sentence.difficulty === 'beginner' ? '🟢 Початківець' : 
                         sentence.difficulty === 'intermediate' ? '🟡 Середній' : '🔴 Просунутий'}
                      </span>
                      <span className="bg-gray-100 px-2 py-1 rounded-full">
                        {sentence.category}
                      </span>
                      <span className="bg-gray-100 px-2 py-1 rounded-full">
                        {sentence.template.language === 'en' ? '🇺🇸 EN' : '🇺🇦 UK'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Кнопки дій */}
          <div className="mt-6 flex gap-4">
            <button
              onClick={() => navigator.clipboard.writeText(
                sentences.map(s => `${s.original}\n${s.translation}`).join('\n\n')
              )}
              className="btn btn-secondary"
            >
              📋 Копіювати всі
            </button>
            <button
              onClick={() => setSentences([])}
              className="btn btn-outline"
            >
              🗑️ Очистити
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
