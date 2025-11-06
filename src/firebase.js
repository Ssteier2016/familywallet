import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBxMzw8I7nc7e29X1xQoH2kgGHIiHzLUGo",
  authDomain: "presupuesto-familiar-15478.firebaseapp.com",
  projectId: "presupuesto-familiar-15478",
  storageBucket: "presupuesto-familiar-15478.firebasestorage.app",
  messagingSenderId: "436445257047",
  appId: "1:436445257047:web:e692e018781bbdeb7c3212",
  measurementId: "G-CBPM2XMB67"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
