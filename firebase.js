// firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc 
} from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBCzQKSufkAp1SpuTreufydl3iuA36HopQ",
  authDomain: "jurda-5a6b2.firebaseapp.com",
  projectId: "jurda-5a6b2",
  storageBucket: "jurda-5a6b2.firebasestorage.app",
  messagingSenderId: "668210342012",
  appId: "1:668210342012:web:e4504c92aa20ef63fe01f9",
  measurementId: "G-M6JT7LWHC1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export const createUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      createdAt: new Date().toISOString(),
      subscription: null,
      customerId: null
    });
    
    return user;
  } catch (error) {
    throw error;
  }
};

export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const logout = () => signOut(auth);

export const getCurrentUser = () => auth.currentUser;

export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);

export const getUserSubscription = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.data()?.subscription;
  } catch (error) {
    throw error;
  }
};

export { auth, db };