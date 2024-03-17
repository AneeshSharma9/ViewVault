import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: `${process.env.REACT_APP_FIREBASE_KEY}`,
    authDomain: "view-vault.firebaseapp.com",
    projectId: "view-vault",
    storageBucket: "view-vault.appspot.com",
    messagingSenderId: "66592832792",
    appId: "1:66592832792:web:afdd72d28111c646e7b26d",
    measurementId: "G-NB90W4XD3F",
    databaseURL: "https://view-vault-default-rtdb.firebaseio.com/",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const provider = new GoogleAuthProvider();

provider.setCustomParameters({   
    prompt : "select_account"
});
export const auth = getAuth();
export const signInWithGooglePopup = () => signInWithPopup(auth, provider);

export const db = getDatabase(app);