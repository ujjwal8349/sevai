// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDEgS66NAnD4Vyumpu2kfc1_OeynKoEJEc",
    authDomain: "sevai-9e407.firebaseapp.com",
    projectId: "sevai-9e407",
    storageBucket: "sevai-9e407.firebasestorage.app",
    messagingSenderId: "152478779766",
    appId: "1:152478779766:web:684451ffff658494b0d257",
    measurementId: "G-EXH2JTRL2B"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();