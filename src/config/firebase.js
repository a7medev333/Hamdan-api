// Import the functions you need from the SDKs you need
const { initializeApp } = require("firebase/app");
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBK_Q1-CxMzwHqHkgsDcz6hUZGd3-J-w4I",
  authDomain: "sweet-app-qoocve.firebaseapp.com",
  projectId: "sweet-app-qoocve",
  storageBucket: "sweet-app-qoocve.appspot.com",
  messagingSenderId: "909816187112",
  appId: "1:909816187112:web:edd462cbf41e17bfe1615d",
  measurementId: "G-20YZ2HG4HQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const token = getToken(messaging, { vapidKey: "BKkDuyb9ur9j6IEwqSj3gBGRecvt_JbWvtJ_0n1bPju8pdmd0mYHu8uO1kliEsN16h2u1UmM6VTMIh2nHLkqbT0" });
module.exports = { app };