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
};

export type Synonym = {
  word: string;
  bangla?: string;
}

export type Antonym = {
  word: string;
  bangla?: string;
}

export type WordFamilyDetail = {
    word: string;
    pronunciation: string;
    meaning: string;
}

export type ExampleSentence = {
    type?: 'Simple' | 'Complex' | 'Compound';
    tense?: 'Present Simple' | 'Present Continuous' | 'Past Simple' | 'Future Simple' | string;
    sentence: string;
    explanation?: string;
}

export type Word = {
  id: string;
  word: string;
  meaning: string;
  meaning_explanation?: string;
  partOfSpeech: 'noun' | 'verb' | 'adjective' | 'adverb' | 'pronoun' | 'preposition' | 'conjunction' | 'interjection' | 'other' | 'Noun/Verb';
  syllables?: string[];
  
  // New detailed fields from JSON
  word_family?: {
      noun?: WordFamilyDetail;
      adjective?: WordFamilyDetail;
      adverb?: WordFamilyDetail;
      verb?: WordFamilyDetail;
      person_noun?: WordFamilyDetail;
      plural_noun?: WordFamilyDetail;
  } | null;
  usage_distinction?: string;
  verb_forms?: VerbForms | null;
  exampleSentences?: {
      by_structure?: ExampleSentence[];
      by_tense?: ExampleSentence[];
  } | null;

  synonyms?: (string | Synonym)[];
  antonyms?: (string | Antonym)[];
  
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

export const partOfSpeechOptions = [
  'noun',
  'verb',
  'adjective',
  'adverb',
  'pronoun',
  'preposition',
  'conjunction',
  'interjection',
  'Noun/Verb',
  'other',
] as const;