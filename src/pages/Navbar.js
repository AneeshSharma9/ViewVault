import { auth, signInWithGooglePopup, db } from "../utils/firebase"
import { signOut } from "firebase/auth";
import { ref, push, get, remove } from "firebase/database";
import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

const Navbar = () => {
    const { isDarkMode, toggleTheme } = useTheme();
    const [uid, setUid] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newListName, setNewListName] = useState("");
    const [newListType, setNewListType] = useState("movies");
    const [customWatchlists, setCustomWatchlists] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [listToDelete, setListToDelete] = useState(null);

    const [loading, setLoading] = useState(true);

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
            setLoading(false);
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
        switch (type) {
            case 'movies': return '🎬';
            case 'tvshows': return '📺';
            default: return '📋';
        }
    };

    const handleDeleteClick = (e, list) => {
        e.preventDefault();
        e.stopPropagation();
        setListToDelete(list);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!listToDelete || !uid) return;

        try {
            const listRef = ref(db, `users/${uid}/customwatchlists/${listToDelete.id}`);
            await remove(listRef);
            setShowDeleteModal(false);
            setListToDelete(null);
            fetchCustomWatchlists(uid);
        } catch (error) {
            console.error('Error deleting watchlist:', error);
        }
    };

    return (
        <nav className={`navbar sticky-top navbar-expand-lg ${isDarkMode ? 'navbar-dark' : 'navbar-light'} navbar-bg p-3 shadow-sm`}>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .fade-in {
                    animation: fadeIn 0.5s ease-in;
                }
            `}</style>
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
                    <li className="nav-item p-2 dropdown">
                        <button className="nav-link dropdown-toggle btn btn-link" type="button" data-bs-toggle="dropdown" aria-expanded="false" style={{ textDecoration: 'none' }}>
                            My Vaults
                        </button>
                        <ul className="dropdown-menu">
                            <li><a className="dropdown-item" href="/movies">Movies</a></li>
                            <li><a className="dropdown-item" href="/tvshows">TV Shows</a></li>
                            {customWatchlists.length > 0 && (
                                <>
                                    <li><hr className="dropdown-divider" /></li>
                                    <li><span className="dropdown-item-text text-muted small">Custom Vaults</span></li>
                                    {customWatchlists.map(list => (
                                        <li key={list.id} className="d-flex align-items-center">
                                            <a className="dropdown-item flex-grow-1" href={`/${list.type}?list=${list.id}`}>
                                                {getTypeIcon(list.type)} {list.name}
                                            </a>
                                            <button
                                                className="btn btn-sm btn-outline-danger me-2"
                                                onClick={(e) => handleDeleteClick(e, list)}
                                                style={{ padding: '2px 6px', fontSize: '12px' }}
                                            >
                                                ✕
                                            </button>
                                        </li>
                                    ))}
                                </>
                            )}
                            <li><hr className="dropdown-divider" /></li>
                            <li><button className="dropdown-item" onClick={() => setShowCreateModal(true)}>+ Create New Vault</button></li>
                        </ul>
                    </li>
                    <li className="nav-item p-2">
                        <a className="nav-link fw-bolder" href="/movienyte">MovieNyte</a>
                    </li>
                </ul>

            </div>
            <div className="d-flex align-items-center gap-3">
                <button
                    onClick={toggleTheme}
                    className="btn btn-link nav-link p-0 d-flex align-items-center justify-content-center theme-toggle-btn"
                    style={{ transition: 'transform 0.3s ease', width: '40px', height: '40px', borderRadius: '50%', background: isDarkMode ? '#333' : '#f0f0f0' }}
                    title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                    <span style={{ fontSize: '1.2rem' }}>{isDarkMode ? '🌞' : '🌙'}</span>
                </button>

                <ul className="navbar-nav">
                    <li className="nav-item">
                        {loading ? (
                            null
                        ) : uid ? (
                            <button className="btn btn-outline-danger rounded-pill px-4 fade-in" onClick={handleSignOut}>Logout</button>
                        ) : (
                            <button className="btn btn-outline-success rounded-pill px-4 fade-in" onClick={handleLogin}>Login</button>
                        )}
                    </li>
                </ul>
            </div>

            {showCreateModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Create New Vault</h5>
                                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Vault Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={newListName}
                                        onChange={(e) => setNewListName(e.target.value)}
                                        placeholder="My Vault"
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

            {showDeleteModal && listToDelete && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Delete Vault</h5>
                                <button type="button" className="btn-close" onClick={() => { setShowDeleteModal(false); setListToDelete(null); }}></button>
                            </div>
                            <div className="modal-body">
                                <p>Are you sure you want to delete "<strong>{listToDelete.name}</strong>"?</p>
                                <p className="text-danger">This will permanently delete the vault and all its items.</p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowDeleteModal(false); setListToDelete(null); }}>Cancel</button>
                                <button type="button" className="btn btn-danger" onClick={handleConfirmDelete}>Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    )
};

export default Navbar;