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
        <nav className="navbar sticky-top navbar-expand-lg navbar-dark bg-dark p-3 shadow">
            <a className="navbar-brand fw-bold" href="/">ViewVault</a>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
            </button>

            <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav mr-auto">
                    <li className="nav-item p-2">
                        <a className="nav-link" href="/searchmovie">Movies</a>
                    </li>
                    <li className="nav-item p-2">
                        <a className="nav-link" href="/searchtv">TV Shows</a>
                    </li>
                    <li className="nav-item p-2">
                        <a className="nav-link" href="/searchanime">Anime</a>
                    </li>
                    <li className="nav-item p-2">
                        <a className="nav-link" href="/searchmanga">Manga</a>
                    </li>
                    <li class="nav-item p-2 dropdown">
                        <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                            My Watchlists
                        </a>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="/movies">Movies</a></li>
                            <li><a class="dropdown-item" href="/tvshows">TV Shows</a></li>
                            <li><a class="dropdown-item" href="/anime">Anime</a></li>
                            <li><a class="dropdown-item" href="/manga">Manga</a></li>
                        </ul>
                    </li>
                    <li className="nav-item p-2">
                        <a className="nav-link fw-bolder" href="/movienyte">MovieNyte</a>
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