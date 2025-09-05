export interface SentenceTemplate {
  id: string;
  category: string;
  template: string; // Шаблон з плейсхолдерами {word1}, {word2}, etc.
  placeholders: {
    [key: string]: {
      type: 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'article';
      description: string;
      examples: string[];
    };
  };
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: 'uk' | 'en';
}

export interface GeneratedSentence {
  id: string;
  original: string;
  translation: string;
  template: SentenceTemplate;
  usedWords: {
    [placeholder: string]: string;
  };
  difficulty: string;
  category: string;
}

export interface SentenceGeneratorConfig {
  language: 'uk' | 'en';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  categories: string[];
  maxSentences: number;
}
