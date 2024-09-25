// Import the functions you need from the Firebase SDKs
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore'; // Thêm import cho Firestore
import { getAuth } from 'firebase/auth'; // Nếu cần sử dụng Authentication

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyD-ahQR58O6VofhfaqvGw9wUdphTMziBtg',
  authDomain: 'lab1-5be8c.firebaseapp.com',
  projectId: 'lab1-5be8c',
  storageBucket: 'lab1-5be8c.appspot.com',
  messagingSenderId: '83995070239',
  appId: '1:83995070239:web:35fb53498357e1f70b2a2a',
  measurementId: 'G-Q2BCNYW177',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Auth
const firestore = getFirestore(app);
const auth = getAuth(app);

export { app, firestore, auth };
