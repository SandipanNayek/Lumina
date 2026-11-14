import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "cortexai-4a328.firebaseapp.com",
  projectId: "cortexai-4a328",
  storageBucket: "cortexai-4a328.firebasestorage.app",
  messagingSenderId: "1061809331503",
  appId: "1:1061809331503:web:9cb863a99ed0bb7c4d95da"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });