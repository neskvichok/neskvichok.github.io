import type { SentenceTemplate, GeneratedSentence, SentenceGeneratorConfig } from './types';
import { SENTENCE_TEMPLATES } from './templates';

export class SentenceGenerator {
  private templates: SentenceTemplate[];

  constructor() {
    this.templates = SENTENCE_TEMPLATES;
  }

  /**
   * Генерує речення на основі конфігурації
   */
  generateSentences(config: SentenceGeneratorConfig): GeneratedSentence[] {
    const filteredTemplates = this.filterTemplates(config);
    const sentences: GeneratedSentence[] = [];

    for (let i = 0; i < config.maxSentences && i < filteredTemplates.length; i++) {
      const template = filteredTemplates[i];
      const sentence = this.generateFromTemplate(template);
      if (sentence) {
        sentences.push(sentence);
      }
    }

    return sentences;
  }

  /**
   * Фільтрує шаблони за конфігурацією
   */
  private filterTemplates(config: SentenceGeneratorConfig): SentenceTemplate[] {
    return this.templates.filter(template => {
      const matchesLanguage = template.language === config.language;
      const matchesDifficulty = template.difficulty === config.difficulty;
      const matchesCategory = config.categories.length === 0 || 
                             config.categories.includes(template.category);
      
      return matchesLanguage && matchesDifficulty && matchesCategory;
    });
  }

  /**
   * Генерує речення з конкретного шаблону
   */
  private generateFromTemplate(template: SentenceTemplate): GeneratedSentence | null {
    try {
      const usedWords: { [key: string]: string } = {};
      let sentence = template.template;

      // Замінюємо плейсхолдери на випадкові слова
      for (const [placeholder, config] of Object.entries(template.placeholders)) {
        const randomWord = this.getRandomWord(config.examples);
        usedWords[placeholder] = randomWord;
        
        // Замінюємо плейсхолдер у шаблоні
        const placeholderRegex = new RegExp(`\\{${placeholder}\\}`, 'g');
        sentence = sentence.replace(placeholderRegex, randomWord);
      }

      // Генеруємо переклад (поки що простий)
      const translation = this.generateTranslation(sentence, template.language);

      return {
        id: `${template.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        original: sentence,
        translation,
        template,
        usedWords,
        difficulty: template.difficulty,
        category: template.category
      };
    } catch (error) {
      console.error('Error generating sentence from template:', error);
      return null;
    }
  }

  /**
   * Отримує випадкове слово з масиву
   */
  private getRandomWord(words: string[]): string {
    const randomIndex = Math.floor(Math.random() * words.length);
    return words[randomIndex];
  }

  /**
   * Генерує переклад речення (поки що простий мапінг)
   */
  private generateTranslation(sentence: string, fromLanguage: string): string {
    // Поки що простий мапінг - в майбутньому можна інтегрувати Google Translate API
    if (fromLanguage === 'en') {
      return this.translateToUkrainian(sentence);
    } else {
      return this.translateToEnglish(sentence);
    }
  }

  /**
   * Простий переклад з англійської на українську
   */
  private translateToUkrainian(sentence: string): string {
    // Простий словник для демонстрації
    const translations: { [key: string]: string } = {
      'a': 'a',
      'an': 'an',
      'the': 'the',
      'cat': 'кіт',
      'dog': 'собака',
      'book': 'книга',
      'car': 'машина',
      'house': 'будинок',
      'tree': 'дерево',
      'flower': 'квітка',
      'bird': 'птах',
      'runs': 'бігає',
      'jumps': 'стрибає',
      'sleeps': 'спить',
      'eats': 'їсть',
      'reads': 'читає',
      'drives': 'їде',
      'grows': 'росте',
      'flies': 'літає',
      'quickly': 'швидко',
      'slowly': 'повільно',
      'quietly': 'тихо',
      'loudly': 'голосно',
      'carefully': 'обережно',
      'happily': 'щасливо',
      'sadly': 'сумно',
      'beautifully': 'гарно',
      'I': 'Я',
      'You': 'Ти',
      'He': 'Він',
      'She': 'Вона',
      'It': 'Воно',
      'We': 'Ми',
      'They': 'Вони',
      'have': 'маю',
      'like': 'люблю',
      'want': 'хочу',
      'need': 'потрібно',
      'see': 'бачу',
      'hear': 'чую',
      'know': 'знаю',
      'think': 'думаю'
    };

    let translated = sentence;
    for (const [en, uk] of Object.entries(translations)) {
      const regex = new RegExp(`\\b${en}\\b`, 'gi');
      translated = translated.replace(regex, uk);
    }

    return translated;
  }

  /**
   * Простий переклад з української на англійську
   */
  private translateToEnglish(sentence: string): string {
    // Простий словник для демонстрації
    const translations: { [key: string]: string } = {
      'кіт': 'cat',
      'собака': 'dog',
      'книга': 'book',
      'машина': 'car',
      'будинок': 'house',
      'дерево': 'tree',
      'квітка': 'flower',
      'птах': 'bird',
      'бігає': 'runs',
      'стрибає': 'jumps',
      'спить': 'sleeps',
      'їсть': 'eats',
      'читає': 'reads',
      'їде': 'drives',
      'росте': 'grows',
      'літає': 'flies',
      'швидко': 'quickly',
      'повільно': 'slowly',
      'тихо': 'quietly',
      'голосно': 'loudly',
      'обережно': 'carefully',
      'щасливо': 'happily',
      'сумно': 'sadly',
      'гарно': 'beautifully',
      'Я': 'I',
      'Ти': 'You',
      'Він': 'He',
      'Вона': 'She',
      'Воно': 'It',
      'Ми': 'We',
      'Вони': 'They',
      'маю': 'have',
      'люблю': 'like',
      'хочу': 'want',
      'потрібно': 'need',
      'бачу': 'see',
      'чую': 'hear',
      'знаю': 'know',
      'думаю': 'think'
    };

    let translated = sentence;
    for (const [uk, en] of Object.entries(translations)) {
      const regex = new RegExp(`\\b${uk}\\b`, 'gi');
      translated = translated.replace(regex, en);
    }

    return translated;
  }

  /**
   * Отримує доступні категорії
   */
  getCategories(): string[] {
    return [...new Set(this.templates.map(t => t.category))];
  }

  /**
   * Отримує доступні рівні складності
   */
  getDifficultyLevels(): string[] {
    return [...new Set(this.templates.map(t => t.difficulty))];
  }

  /**
   * Отримує доступні мови
   */
  getLanguages(): string[] {
    return [...new Set(this.templates.map(t => t.language))];
  }
}
