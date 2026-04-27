"use client";

import { getApps, initializeApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyCr7SV1xmki9hG1QTYJsN1W9_V-MyApx_w",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "fun-friday-game.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "fun-friday-game",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "fun-friday-game.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "464717949557",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:464717949557:web:3b199943673d4685c9263c",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "G-47590G4K6X",
};

const missingConfig = !firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId;

export const isFirebaseConfigured = !missingConfig;

export const firebaseApp = isFirebaseConfigured
  ? getApps()[0] ?? initializeApp(firebaseConfig)
  : null;

export const db = firebaseApp ? getFirestore(firebaseApp) : null;

export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (!firebaseApp || typeof window === "undefined") return null;
  return (await isSupported()) ? getAnalytics(firebaseApp) : null;
}
