import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  connectAuthEmulator,
  type Auth,
  type Persistence,
} from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, type FirebaseStorage } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator, type Functions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

/** Web config for FirebaseRecaptchaVerifierModal */
export const firebaseWebConfig = firebaseConfig;

function isPlaceholder(value: string): boolean {
  return !value || value.includes('your_') || value === 'undefined';
}

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    !isPlaceholder(firebaseConfig.apiKey) &&
    !isPlaceholder(firebaseConfig.projectId),
);

const catalogFirebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_CATALOG_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_CATALOG_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_CATALOG_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_CATALOG_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_CATALOG_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_CATALOG_FIREBASE_APP_ID ?? '',
};

/** Krushi Sarthi product catalog (optional separate Firebase project). */
export const isProductCatalogConfigured = Boolean(
  catalogFirebaseConfig.apiKey &&
    catalogFirebaseConfig.projectId &&
    !isPlaceholder(catalogFirebaseConfig.apiKey) &&
    !isPlaceholder(catalogFirebaseConfig.projectId),
);

let app: FirebaseApp | undefined;
let catalogApp: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let catalogDb: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let functions: Functions | undefined;

function createAuth(firebaseApp: FirebaseApp): Auth {
  if (Platform.OS === 'web') {
    return getAuth(firebaseApp);
  }
  try {
    const authModule = require('firebase/auth') as typeof import('firebase/auth') & {
      getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
    };
    return initializeAuth(firebaseApp, {
      persistence: authModule.getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'auth/already-initialized') {
      return getAuth(firebaseApp);
    }
    return getAuth(firebaseApp);
  }
}

function initFirebase() {
  if (!isFirebaseConfigured || app) return;

  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = createAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  functions = getFunctions(
    app,
    process.env.EXPO_PUBLIC_FIREBASE_FUNCTIONS_REGION ?? 'asia-south1',
  );

  if (__DEV__ && process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    connectFunctionsEmulator(functions, 'localhost', 5001);
  }
}

function initProductCatalogFirebase() {
  if (!isProductCatalogConfigured || catalogDb) return;

  const existing = getApps().find((item) => item.name === 'product-catalog');
  catalogApp = existing ?? initializeApp(catalogFirebaseConfig, 'product-catalog');
  catalogDb = getFirestore(catalogApp);
}

export function getFirebaseAuth(): Auth {
  initFirebase();
  if (!auth) throw new Error('Firebase is not configured. Add credentials to .env or use Demo Mode.');
  return auth;
}

export function getFirebaseDb(): Firestore {
  initFirebase();
  if (!db) throw new Error('Firebase is not configured.');
  return db;
}

/** Firestore for product catalog — Krushi Sarthi project or main app `products` collection. */
export function getProductCatalogDb(): Firestore {
  if (isProductCatalogConfigured) {
    initProductCatalogFirebase();
    if (!catalogDb) throw new Error('Product catalog Firebase is not configured.');
    return catalogDb;
  }
  return getFirebaseDb();
}

export function getFirebaseStorage(): FirebaseStorage {
  initFirebase();
  if (!storage) throw new Error('Firebase is not configured.');
  return storage;
}

export function getFirebaseFunctions(): Functions {
  initFirebase();
  if (!functions) throw new Error('Firebase is not configured.');
  return functions;
}

export default app;
