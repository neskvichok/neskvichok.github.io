import type { SentenceTemplate } from './types';

export const SENTENCE_TEMPLATES: SentenceTemplate[] = [
  // Прості речення для початківців
  {
    id: 'simple-present-1',
    category: 'present-simple',
    template: '{article} {noun} {verb} {adverb}.',
    placeholders: {
      article: {
        type: 'article',
        description: 'Артикль',
        examples: ['a', 'an', 'the']
      },
      noun: {
        type: 'noun',
        description: 'Іменник',
        examples: ['cat', 'dog', 'book', 'car', 'house', 'tree', 'flower', 'bird']
      },
      verb: {
        type: 'verb',
        description: 'Дієслово в теперішньому часі',
        examples: ['runs', 'jumps', 'sleeps', 'eats', 'reads', 'drives', 'grows', 'flies']
      },
      adverb: {
        type: 'adverb',
        description: 'Прислівник',
        examples: ['quickly', 'slowly', 'quietly', 'loudly', 'carefully', 'happily', 'sadly', 'beautifully']
      }
    },
    difficulty: 'beginner',
    language: 'en'
  },
  {
    id: 'simple-present-2',
    category: 'present-simple',
    template: '{pronoun} {verb} {article} {noun}.',
    placeholders: {
      pronoun: {
        type: 'noun',
        description: 'Займенник',
        examples: ['I', 'You', 'He', 'She', 'It', 'We', 'They']
      },
      verb: {
        type: 'verb',
        description: 'Дієслово в теперішньому часі',
        examples: ['have', 'like', 'want', 'need', 'see', 'hear', 'know', 'think']
      },
      article: {
        type: 'article',
        description: 'Артикль',
        examples: ['a', 'an', 'the']
      },
      noun: {
        type: 'noun',
        description: 'Іменник',
        examples: ['cat', 'dog', 'book', 'car', 'house', 'tree', 'flower', 'bird']
      }
    },
    difficulty: 'beginner',
    language: 'en'
  },
  {
    id: 'ukrainian-simple-1',
    category: 'present-simple',
    template: '{noun} {verb} {adverb}.',
    placeholders: {
      noun: {
        type: 'noun',
        description: 'Іменник',
        examples: ['кіт', 'собака', 'книга', 'машина', 'будинок', 'дерево', 'квітка', 'птах']
      },
      verb: {
        type: 'verb',
        description: 'Дієслово в теперішньому часі',
        examples: ['бігає', 'стрибає', 'спить', 'їсть', 'читає', 'їде', 'росте', 'літає']
      },
      adverb: {
        type: 'adverb',
        description: 'Прислівник',
        examples: ['швидко', 'повільно', 'тихо', 'голосно', 'обережно', 'щасливо', 'сумно', 'гарно']
      }
    },
    difficulty: 'beginner',
    language: 'uk'
  },
  {
    id: 'ukrainian-simple-2',
    category: 'present-simple',
    template: '{pronoun} {verb} {noun}.',
    placeholders: {
      pronoun: {
        type: 'noun',
        description: 'Займенник',
        examples: ['Я', 'Ти', 'Він', 'Вона', 'Воно', 'Ми', 'Ви', 'Вони']
      },
      verb: {
        type: 'verb',
        description: 'Дієслово в теперішньому часі',
        examples: ['маю', 'люблю', 'хочу', 'потрібно', 'бачу', 'чую', 'знаю', 'думаю']
      },
      noun: {
        type: 'noun',
        description: 'Іменник',
        examples: ['кіта', 'собаку', 'книгу', 'машину', 'будинок', 'дерево', 'квітку', 'птаха']
      }
    },
    difficulty: 'beginner',
    language: 'uk'
  },

  // Середній рівень
  {
    id: 'past-simple-1',
    category: 'past-simple',
    template: '{pronoun} {verb} {article} {noun} {preposition} {place}.',
    placeholders: {
      pronoun: {
        type: 'noun',
        description: 'Займенник',
        examples: ['I', 'You', 'He', 'She', 'It', 'We', 'They']
      },
      verb: {
        type: 'verb',
        description: 'Дієслово в минулому часі',
        examples: ['bought', 'saw', 'visited', 'found', 'lost', 'met', 'took', 'gave']
      },
      article: {
        type: 'article',
        description: 'Артикль',
        examples: ['a', 'an', 'the']
      },
      noun: {
        type: 'noun',
        description: 'Іменник',
        examples: ['book', 'car', 'house', 'gift', 'ticket', 'photo', 'letter', 'present']
      },
      preposition: {
        type: 'preposition',
        description: 'Прийменник',
        examples: ['in', 'at', 'on', 'near', 'under', 'over', 'beside', 'behind']
      },
      place: {
        type: 'noun',
        description: 'Місце',
        examples: ['store', 'park', 'school', 'home', 'office', 'restaurant', 'library', 'museum']
      }
    },
    difficulty: 'intermediate',
    language: 'en'
  },
  {
    id: 'ukrainian-past-1',
    category: 'past-simple',
    template: '{pronoun} {verb} {noun} {preposition} {place}.',
    placeholders: {
      pronoun: {
        type: 'noun',
        description: 'Займенник',
        examples: ['Я', 'Ти', 'Він', 'Вона', 'Воно', 'Ми', 'Ви', 'Вони']
      },
      verb: {
        type: 'verb',
        description: 'Дієслово в минулому часі',
        examples: ['купив', 'бачив', 'відвідав', 'знайшов', 'втратив', 'зустрів', 'взяв', 'дав']
      },
      noun: {
        type: 'noun',
        description: 'Іменник',
        examples: ['книгу', 'машину', 'будинок', 'подарунок', 'квиток', 'фото', 'лист', 'подарунок']
      },
      preposition: {
        type: 'preposition',
        description: 'Прийменник',
        examples: ['в', 'на', 'біля', 'під', 'над', 'поруч', 'за']
      },
      place: {
        type: 'noun',
        description: 'Місце',
        examples: ['магазині', 'парку', 'школі', 'домі', 'офісі', 'ресторані', 'бібліотеці', 'музеї']
      }
    },
    difficulty: 'intermediate',
    language: 'uk'
  },

  // Складні речення
  {
    id: 'complex-1',
    category: 'complex',
    template: 'Although {pronoun} {verb1} {article} {noun}, {pronoun2} {verb2} {adverb}.',
    placeholders: {
      pronoun: {
        type: 'noun',
        description: 'Займенник',
        examples: ['I', 'You', 'He', 'She', 'It', 'We', 'They']
      },
      verb1: {
        type: 'verb',
        description: 'Дієслово в теперішньому часі',
        examples: ['have', 'like', 'want', 'need', 'see', 'hear', 'know', 'think']
      },
      article: {
        type: 'article',
        description: 'Артикль',
        examples: ['a', 'an', 'the']
      },
      noun: {
        type: 'noun',
        description: 'Іменник',
        examples: ['problem', 'difficulty', 'challenge', 'issue', 'question', 'matter', 'concern', 'worry']
      },
      pronoun2: {
        type: 'noun',
        description: 'Займенник',
        examples: ['I', 'You', 'He', 'She', 'It', 'We', 'They']
      },
      verb2: {
        type: 'verb',
        description: 'Дієслово в теперішньому часі',
        examples: ['continue', 'persist', 'succeed', 'achieve', 'overcome', 'manage', 'handle', 'deal']
      },
      adverb: {
        type: 'adverb',
        description: 'Прислівник',
        examples: ['anyway', 'still', 'nevertheless', 'however', 'nonetheless', 'regardless', 'despite', 'yet']
      }
    },
    difficulty: 'advanced',
    language: 'en'
  }
];

export const CATEGORIES = [
  'present-simple',
  'past-simple',
  'future-simple',
  'present-continuous',
  'past-continuous',
  'present-perfect',
  'past-perfect',
  'complex',
  'questions',
  'negations'
];

export const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
