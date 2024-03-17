import { auth, signInWithGooglePopup } from "../utils/firebase"
import { signOut } from "firebase/auth";
import { useState, useEffect } from "react";

const Navbar = () => {
    const [uid, setUid] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                const uid = user.uid;
                setUid(uid);
            } else {
                setUid(null);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = async () => {
        const response = await signInWithGooglePopup();
        console.log(response);
    }

    const handleSignOut = () => {
        signOut(auth)
            .then(() => {
                console.log('Sign-out successful.');
            })
            .catch((error) => {
                console.error('Error signing out:', error.message);
            });
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark p-3">
            <a className="navbar-brand" href="/">ViewVault</a>
            <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
            </button>

            <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav mr-auto">
                    <li className="nav-item">
                        <a className="nav-link" href="/searchmovie">Movies</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="/">TV Shows</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="/">Anime</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="/">Manga</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="/movies">Watchlists</a>
                    </li>
                </ul>

            </div>
            <ul className="navbar-nav ml-auto">
                <li className="nav-item">
                    {uid ?
                        <button className="btn btn-outline-danger my-2 my-sm-0" onClick={handleSignOut}>Logout</button>
                        :
                        <button className="btn btn-outline-success my-2 my-sm-0" onClick={handleLogin}>Login</button>
                    }
                </li>
            </ul>
        </nav>
    )
};

export default Navbar;