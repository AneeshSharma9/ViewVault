import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCJ5mnBxcj3VUrSce_5CStPfyfetJ8jUWw",
    authDomain: "view-vault.firebaseapp.com",
    projectId: "view-vault",
    storageBucket: "view-vault.appspot.com",
    messagingSenderId: "66592832792",
    appId: "1:66592832792:web:afdd72d28111c646e7b26d",
    measurementId: "G-NB90W4XD3F",
    databaseURL: "https://view-vault-default-rtdb.firebaseio.com/",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const provider = new GoogleAuthProvider();

provider.setCustomParameters({   
    prompt : "select_account"
});
export const auth = getAuth();
export const signInWithGooglePopup = () => signInWithPopup(auth, provider);

export const db = getDatabase(app);