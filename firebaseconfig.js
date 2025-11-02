// === Konfigurasi Firebase untuk CTPS Quiz ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

// Konfigurasi proyek kamu
const firebaseConfig = {
  apiKey: "AIzaSyAOERI5Ht7Qk7jrKFr1iY2nI0G3LxIg46U",
  authDomain: "cuci-tangan-pakai-sabun.firebaseapp.com",
  databaseURL: "https://cuci-tangan-pakai-sabun-default-rtdb.firebaseio.com/",
  projectId: "cuci-tangan-pakai-sabun",
  storageBucket: "cuci-tangan-pakai-sabun.firebasestorage.app",
  messagingSenderId: "889628313975",
  appId: "1:889628313975:web:698fc8513c7ed57ec73972",
  measurementId: "G-1TM1M44LZ5"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Inisialisasi Realtime Database
const db = getDatabase(app);

// Ekspor agar bisa dipakai di script.js
export { db, ref, push, onValue };
