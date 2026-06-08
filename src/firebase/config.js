import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyCqoogIeKP73ZnfOUqU6AC22i0boU8vd1Y",
  authDomain: "gcc-app-a2bc1.firebaseapp.com",
  projectId: "gcc-app-a2bc1",
  storageBucket: "gcc-app-a2bc1.firebasestorage.app",
  messagingSenderId: "155457419479",
  appId: "1:155457419479:web:245c7e578d567b1e4ed892"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)