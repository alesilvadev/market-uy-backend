import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let db: Firestore;
let auth: Auth;

export function initializeFirebase() {
  try {
    initializeApp();
    db = getFirestore();
    auth = getAuth();
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

export function getFirestoreDb(): Firestore {
  if (!db) {
    initializeFirebase();
  }
  return db;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    initializeFirebase();
  }
  return auth;
}
