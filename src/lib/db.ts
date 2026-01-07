'use client';
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Word, Note } from './types';

interface WordProDB extends DBSchema {
  words: {
    key: number;
    value: Word;
    indexes: { 'difficulty': string; 'word': string };
  };
  notes: {
    key: number;
    value: Note;
  };
}

let dbPromise: Promise<IDBPDatabase<WordProDB>> | null = null;

const getDbInstance = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  if (!dbPromise) {
    dbPromise = openDB<WordProDB>('WordProDB', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('words')) {
          const store = db.createObjectStore('words', {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('difficulty', 'difficulty');
          store.createIndex('word', 'word', { unique: true });
        }
        if (!db.objectStoreNames.contains('notes')) {
          db.createObjectStore('notes', {
            keyPath: 'id',
            autoIncrement: true,
          });
        }
      },
    });
  }
  return dbPromise;
};


export const getDB = async () => {
    return getDbInstance();
}

// Word Functions
export async function addWord(word: Omit<Word, 'id' | 'createdAt' | 'updatedAt'>) {
    const db = await getDbInstance();
    if (!db) return;
    const now = new Date().toISOString();
    return db.add('words', { 
        ...word, 
        createdAt: now, 
        updatedAt: now,
    } as any);
}

export async function getAllWords() {
    const db = await getDbInstance();
    if (!db) return [];
    return db.getAll('words');
}

export async function getWord(id: number) {
    const db = await getDbInstance();
    if (!db) return undefined;
    return db.get('words', id);
}

export async function updateWord(word: Word) {
    const db = await getDbInstance();
    if (!db) return;
    const now = new Date().toISOString();
    return db.put('words', { ...word, updatedAt: now });
}

export async function deleteWord(id: number) {
    const db = await getDbInstance();
    if (!db) return;
    return db.delete('words', id);
}

export async function getWordsByDifficulty(difficulty: ('Easy' | 'Medium' | 'Hard' | 'New')[]) {
    const db = await getDbInstance();
    if (!db) return [];
    const tx = db.transaction('words', 'readonly');
    const index = tx.store.index('difficulty');
    const promises = difficulty.map(level => index.getAll(level));
    const results = await Promise.all(promises);
    await tx.done;
    return results.flat();
}

export async function getWordsForQuiz(count: number) {
    const db = await getDbInstance();
    if (!db) return [];
    let words = await getWordsByDifficulty(['Hard', 'Medium']);
    if (words.length < count) {
        const allWords = await getAllWords();
        const otherWords = allWords.filter(w => w.difficulty !== 'Hard' && w.difficulty !== 'Medium');
        words = [...words, ...otherWords];
    }
    return words.sort(() => 0.5 - Math.random()).slice(0, count);
}


// Note Functions
export async function addNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) {
    const db = await getDbInstance();
    if (!db) return;
    const now = new Date().toISOString();
    return db.add('notes', { 
        ...note, 
        createdAt: now, 
        updatedAt: now 
    } as any);
}

export async function getAllNotes() {
    const db = await getDbInstance();
    if (!db) return [];
    return db.getAll('notes');
}

export async function updateNote(note: Note) {
    const db = await getDbInstance();
    if (!db) return;
    const now = new Date().toISOString();
    return db.put('notes', { ...note, updatedAt: now });
}

export async function deleteNote(id: number) {
    const db = await getDbInstance();
    if (!db) return;
    return db.delete('notes', id);
}
