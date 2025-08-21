export type QuizWord = {
  id: string;
  hint: string;
  answer: string | string[];
  shortMemory?: number;
  originalSetId?: string;
};

export type QuizSet = {
  id: string;
  name: string;
  words: QuizWord[];
};


