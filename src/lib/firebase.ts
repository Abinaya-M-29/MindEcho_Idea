import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { JournalSession, UserProfile } from '../types';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Authentication setup
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Strict Undefined-Stripping Utility (Zero-Crash Payload Hygiene)
export function sanitizePayload<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizePayload) as any;
  }
  if (typeof obj === 'object') {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        clean[key] = sanitizePayload(value);
      }
    }
    return clean as any;
  }
  return obj;
}

// Sign in with Google Popup
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      await syncUserProfile(result.user);
    }
    return result.user;
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
}

// Sign out
export async function signOutUser() {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Error signing out:', error);
    throw error;
  }
}

// Auto-create and sync user document profile in Firestore on login
export async function syncUserProfile(user: User): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const now = new Date().toISOString();

  try {
    const docSnap = await getDoc(userRef);
    if (!docSnap.exists()) {
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Reflective Soul',
        photoURL: user.photoURL,
        createdAt: now,
        lastLoginAt: now,
        reflectionCount: 0,
      };
      await setDoc(userRef, sanitizePayload({
        ...newProfile,
        serverCreatedAt: serverTimestamp(),
      }));
      return newProfile;
    } else {
      const existing = docSnap.data() as UserProfile;
      await setDoc(
        userRef,
        sanitizePayload({
          lastLoginAt: now,
          displayName: user.displayName || existing.displayName || 'Reflective Soul',
          photoURL: user.photoURL || existing.photoURL || null,
        }),
        { merge: true }
      );
      return {
        ...existing,
        lastLoginAt: now,
      };
    }
  } catch (err) {
    console.error('Failed to sync user profile:', err);
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: now,
      lastLoginAt: now,
    };
  }
}

// Retrieve all journal sessions for current authenticated user
export async function getUserSessions(userId: string): Promise<JournalSession[]> {
  try {
    const q = query(
      collection(db, 'entries'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const sessions: JournalSession[] = [];
    querySnapshot.forEach((d) => {
      sessions.push(d.data() as JournalSession);
    });
    return sessions;
  } catch (error: any) {
    console.warn('Index or query fallback for entries:', error);
    // If composite index is pending, fallback to filtering by userId and sorting in memory
    try {
      const fallbackQuery = query(
        collection(db, 'entries'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(fallbackQuery);
      const sessions: JournalSession[] = [];
      snapshot.forEach((d) => {
        sessions.push(d.data() as JournalSession);
      });
      return sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } catch (fallbackErr) {
      console.error('Error fetching sessions:', fallbackErr);
      return [];
    }
  }
}

// Save or Update Journal Session in Firestore
export async function saveJournalSession(session: JournalSession): Promise<void> {
  if (!session.id || !session.userId) {
    throw new Error('Session ID and User ID are required to save.');
  }
  const cleanSession = sanitizePayload(session);
  const entryRef = doc(db, 'entries', session.id);
  await setDoc(entryRef, cleanSession, { merge: true });

  // Increment user profile count
  try {
    const userRef = doc(db, 'users', session.userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const count = (userSnap.data()?.reflectionCount || 0) + 1;
      await setDoc(userRef, { reflectionCount: count }, { merge: true });
    }
  } catch (e) {
    // Non-blocking
  }
}

// Delete single session
export async function deleteJournalSession(sessionId: string): Promise<void> {
  const entryRef = doc(db, 'entries', sessionId);
  await deleteDoc(entryRef);
}

// Delete entire user account and batch delete all user Firestore data
export async function deleteAllUserData(userId: string): Promise<void> {
  const batch = writeBatch(db);

  // 1. Delete all user entries
  const q = query(collection(db, 'entries'), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });

  // 2. Delete user profile doc
  const userRef = doc(db, 'users', userId);
  batch.delete(userRef);

  await batch.commit();
}
