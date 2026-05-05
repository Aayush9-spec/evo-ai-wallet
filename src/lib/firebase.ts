import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const isFirebaseConfigured = !!import.meta.env.VITE_FIREBASE_API_KEY;

let app;
let analytics;
let auth: any = {
  currentUser: null,
  onAuthStateChanged: (authInstance: any, callback: any) => {
    // Handle both (callback) and (auth, callback) signatures for robustness
    const cb = typeof authInstance === 'function' ? authInstance : callback;
    setTimeout(() => cb(null), 100);
    return () => {};
  }
};
let googleProvider = {};
let db = {};
let storage = {};

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    analytics = getAnalytics(app);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.warn("Firebase API Key is missing. Running in mock mode.");
}

export { auth, googleProvider, db, storage, app, analytics };
