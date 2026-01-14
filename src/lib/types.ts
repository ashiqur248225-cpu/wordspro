export type VerbFormDetail = {
  word: string;
  pronunciation?: string;
  bangla_meaning?: string;
  usage_timing?: string;
};

export type VerbForms = {
  v1_present?: VerbFormDetail;
  v2_past?: VerbFormDetail;
  v3_past_participle?: VerbFormDetail;
  form_examples?: {
    v1?: string;
    v2?: string;
    v3?: string;
  };
};

export type Synonym = {
  word: string;
  bangla?: string;
}

export type Antonym = {
  word: string;
  bangla?: string;
}

export type Word = {
  id: string; // Changed to UUID
  word: string;
  meaning: string;
  meaning_explanation?: string;
  partOfSpeech: 'noun' | 'verb' | 'adjective' | 'adverb' | 'pronoun' | 'preposition' | 'conjunction' | 'interjection' | 'other';
  syllables?: string[];
  usageDistinction?: string;
  synonyms?: (string | Synonym)[];
  antonyms?: (string | Antonym)[];
  exampleSentences?: string[];
  verb_forms?: VerbForms | null;
  difficulty: 'New' | 'Easy' | 'Medium' | 'Hard' | 'Learned';
  
  // System-managed stats
  wrong_count?: {
    spelling: number;
    meaning: number;
    synonym: number;
    antonym: number;
  };
  correct_count?: number;
  total_exams?: number;
  correct_streak?: number;

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

export type WordDifficulty = 'New' | 'Easy' | 'Medium' | 'Hard' | 'Learned';

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

    