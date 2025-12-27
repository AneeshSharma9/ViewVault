import { auth, signInWithGooglePopup, db } from "../utils/firebase"
import { signOut } from "firebase/auth";
import { ref, push, get } from "firebase/database";
import { useState, useEffect } from "react";

const Navbar = () => {
    const [uid, setUid] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newListName, setNewListName] = useState("");
    const [newListType, setNewListType] = useState("movies");
    const [customWatchlists, setCustomWatchlists] = useState([]);

    const fetchCustomWatchlists = async (userId) => {
        try {
            const watchlistsRef = ref(db, `users/${userId}/customwatchlists`);
            const snapshot = await get(watchlistsRef);
            if (snapshot.exists()) {
                const data = snapshot.val();
                const watchlistsArray = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                setCustomWatchlists(watchlistsArray);
            } else {
                setCustomWatchlists([]);
            }
        } catch (error) {
            console.error('Error fetching custom watchlists:', error);
        }
    };

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                const uid = user.uid;
                setUid(uid);
                fetchCustomWatchlists(uid);
            } else {
                setUid(null);
                setCustomWatchlists([]);
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

    const handleCreateWatchlist = async () => {
        if (!newListName.trim() || !uid) return;
        
        try {
            const watchlistsRef = ref(db, `users/${uid}/customwatchlists`);
            await push(watchlistsRef, {
                name: newListName.trim(),
                type: newListType,
                createdAt: Date.now()
            });
            setShowCreateModal(false);
            setNewListName("");
            setNewListType("movies");
            fetchCustomWatchlists(uid);
        } catch (error) {
            console.error('Error creating watchlist:', error);
        }
    };

    const getTypeIcon = (type) => {
        switch(type) {
            case 'movies': return '🎬';
            case 'tvshows': return '📺';
            case 'anime': return '🎌';
            case 'manga': return '📚';
            default: return '📋';
        }
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
                    <li className="nav-item p-2 dropdown">
                        <button className="nav-link dropdown-toggle btn btn-link" type="button" data-bs-toggle="dropdown" aria-expanded="false" style={{ textDecoration: 'none' }}>
                            My Watchlists
                        </button>
                        <ul className="dropdown-menu">
                            <li><a className="dropdown-item" href="/movies">Movies</a></li>
                            <li><a className="dropdown-item" href="/tvshows">TV Shows</a></li>
                            <li><a className="dropdown-item" href="/anime">Anime</a></li>
                            <li><a className="dropdown-item" href="/manga">Manga</a></li>
                            {customWatchlists.length > 0 && (
                                <>
                                    <li><hr className="dropdown-divider" /></li>
                                    <li><span className="dropdown-item-text text-muted small">Custom Watchlists</span></li>
                                    {customWatchlists.map(list => (
                                        <li key={list.id}>
                                            <a className="dropdown-item" href={`/${list.type}?list=${list.id}`}>
                                                {getTypeIcon(list.type)} {list.name}
                                            </a>
                                        </li>
                                    ))}
                                </>
                            )}
                            <li><hr className="dropdown-divider" /></li>
                            <li><button className="dropdown-item" onClick={() => setShowCreateModal(true)}>+ Create New Watchlist</button></li>
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

            {showCreateModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Create New Watchlist</h5>
                                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Watchlist Name</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        value={newListName}
                                        onChange={(e) => setNewListName(e.target.value)}
                                        placeholder="My Watchlist"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Type</label>
                                    <select 
                                        className="form-select"
                                        value={newListType}
                                        onChange={(e) => setNewListType(e.target.value)}
                                    >
                                        <option value="movies">Movies</option>
                                        <option value="tvshows">TV Shows</option>
                                        <option value="anime">Anime</option>
                                        <option value="manga">Manga</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="button" className="btn btn-primary" onClick={handleCreateWatchlist} disabled={!newListName.trim()}>Create</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    )
};

export default Navbar;