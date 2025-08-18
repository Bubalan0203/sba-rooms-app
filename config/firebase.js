// src/config/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBmFiFVPOJb0A_UVwy1Hqr7UPPViqhAgpU",
  authDomain: "sba-rooms.firebaseapp.com",
  projectId: "sba-rooms",
  storageBucket: "sba-rooms.firebasestorage.app",
  messagingSenderId: "930335849543",
  appId: "1:930335849543:web:c2dae2a809294bca58c562",
  measurementId: "G-HLJESY8ZNH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);