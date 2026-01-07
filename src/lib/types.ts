export type Word = {
  id: number;
  word: string;
  meaning: string;
  partOfSpeech: 'noun' | 'verb' | 'adjective' | 'adverb' | 'pronoun' | 'preposition' | 'conjunction' | 'interjection' | 'other';
  explanation?: string;
  syllables?: string;
  usageDistinction?: string;
  synonyms: string;
  antonyms: string;
  exampleSentences: string;
  difficulty: 'New' | 'Easy' | 'Medium' | 'Hard';
  createdAt: string;
  updatedAt: string;
};

export type Note = {
  id: number;
  title: string;
  content: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
};

export type WordDifficulty = 'New' | 'Easy' | 'Medium' | 'Hard';

export const partOfSpeechOptions: Word['partOfSpeech'][] = [
  'noun',
  'verb',
  'adjective',
  'adverb',
  'pronoun',
  'preposition',
  'conjunction',
  'interjection',
  'other',
];
