// Firebase جاهز للعمل على GitHub Pages بدون Vite أو Webpack
const firebaseConfig = {
  apiKey: "AIzaSyA4Rk_vvmDWyog5wP8rLBFqnyBuDuANL4Q",
  authDomain: "sufaraa-d58fa.firebaseapp.com",
  projectId: "sufaraa-d58fa",
  storageBucket: "sufaraa-d58fa.firebasestorage.app",
  messagingSenderId: "537747604276",
  appId: "1:537747604276:web:5342c061bd8464980c5b61",
  measurementId: "G-FEHR15L0DE"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const FieldValue = firebase.firestore.FieldValue;
const Timestamp = firebase.firestore.Timestamp;
