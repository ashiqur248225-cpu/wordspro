
'use client';
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Word, Note } from './types';

interface WordProDB extends DBSchema {
  words: {
    key: string; // Changed to string for UUID
    value: Word;
    indexes: { 'difficulty': string; 'word': string };
  };
  notes: {
    key: number;
    value: Note;
    indexes: { 'category': string };
  };
}

let dbPromise: Promise<IDBPDatabase<WordProDB>> | null = null;

const getDbInstance = () => {
  if (typeof window === 'undefined') {
    // Return a mock object or null on the server
    return null;
  }
  if (!dbPromise) {
    dbPromise = openDB<WordProDB>('WordProDB', 3, { // Bumped version to 3
      upgrade(db, oldVersion, newVersion, transaction) {
        if (oldVersion < 1) {
            // Initial schema
             if (!db.objectStoreNames.contains('words')) {
                const store = db.createObjectStore('words', {
                    keyPath: 'id',
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
        }
        if (oldVersion < 2) {
             // Migration for version 2
            if (db.objectStoreNames.contains('words')) {
                db.deleteObjectStore('words');
            }
            const store = db.createObjectStore('words', {
                keyPath: 'id',
            });
            store.createIndex('difficulty', 'difficulty');
            store.createIndex('word', 'word', { unique: true });
        }
         if (oldVersion < 3) {
            // Add category index to notes
            const notesStore = transaction.objectStore('notes');
            if (!notesStore.indexNames.contains('category')) {
                notesStore.createIndex('category', 'category');
            }
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
    const newId = crypto.randomUUID();
    return db.add('words', { 
        ...word,
        id: newId,
        createdAt: now, 
        updatedAt: now,
    } as Word);
}

export async function bulkAddWords(words: any[]) {
    const db = await getDbInstance();
    if (!db) return { successCount: 0, errorCount: 0, errors: [] };

    const tx = db.transaction('words', 'readwrite');
    let successCount = 0;
    let errorCount = 0;
    const errors: { word: string, error: string }[] = [];
    const now = new Date().toISOString();

    for (const word of words) {
        try {
            const newId = crypto.randomUUID();
            // Map the incoming JSON structure to the Word type structure
            const wordToAdd: Word = {
                id: newId,
                word: word.word,
                meaning: word.meaning,
                meaning_explanation: word.meaning_explanation,
                partOfSpeech: word.parts_of_speech,
                syllables: word.syllables,
                usageDistinction: word.usage_distinction,
                exampleSentences: word.example_sentences,
                synonyms: word.synonyms,
                antonyms: word.antonyms,
                verb_forms: word.verb_forms,
                createdAt: now,
                updatedAt: now,
                difficulty: 'New',
                correct_count: 0,
                wrong_count: { spelling: 0, meaning: 0 },
                total_exams: 0,
            };
            await tx.store.add(wordToAdd);
            successCount++;
        } catch (e: any) {
            errorCount++;
            errors.push({ word: word.word, error: e.message || 'Unknown error' });
        }
    }
    await tx.done;
    return { successCount, errorCount, errors };
}

export async function getAllWords() {
    const db = await getDbInstance();
    if (!db) return [];
    return db.getAll('words');
}

export async function getWord(id: string) { // id is now string
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

export async function deleteWord(id: string) { // id is now string
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

export async function bulkAddNotes(notes: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>[]) {
    const db = await getDbInstance();
    if (!db) return { successCount: 0, errorCount: 0, errors: [] };

    const tx = db.transaction('notes', 'readwrite');
    let successCount = 0;
    let errorCount = 0;
    const errors: { title: string, error: string }[] = [];
    const now = new Date().toISOString();

    for (const note of notes) {
        try {
             await tx.store.add({
                ...note,
                createdAt: now,
                updatedAt: now,
            } as any);
            successCount++;
        } catch (e: any) {
            errorCount++;
            errors.push({ title: note.title, error: e.message || 'Unknown error' });
        }
    }
    await tx.done;
    return { successCount, errorCount, errors };
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
