import { auth, signInWithGooglePopup } from "../utils/firebase"
import { signOut } from "firebase/auth";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";

const Navbar = ({ onToggleSidebar, isSidebarOpen }) => {
    const { isDarkMode, toggleTheme } = useTheme();
    const [uid, setUid] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchType, setSearchType] = useState("movies"); // "movies" or "tv"
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                setUid(user.uid);
            } else {
                setUid(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = async () => {
        await signInWithGooglePopup();
    }

    const handleSignOut = () => {
        signOut(auth).catch((error) => console.error('Error signing out:', error.message));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            const route = searchType === "movies" ? "/searchmovie" : "/searchtv";
            navigate(route, { state: { query: searchQuery.trim() } });
            setSearchQuery("");
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch(e);
        }
    };

    return (
        <nav className={`navbar sticky-top ${isDarkMode ? 'navbar-dark' : 'navbar-light'} navbar-bg px-4 py-3 shadow-sm d-flex justify-content-between align-items-center`}>
            <div className="d-flex align-items-center gap-3 flex-grow-1">
                <button
                    className="btn btn-link p-0 text-muted me-2 sidebar-toggle-btn"
                    onClick={onToggleSidebar}
                    title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                    style={{
                        fontSize: '1.5rem',
                        textDecoration: 'none',
                        transition: 'transform 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%'
                    }}
                >
                    {isSidebarOpen ? '⇠' : '☰'}
                </button>

                {/* Search Bar */}
                <div className="d-none d-md-flex align-items-center gap-2" style={{ minWidth: '300px', maxWidth: '600px', flex: '1' }}>
                    {/* Toggle Switch */}
                    <div className="d-flex align-items-center bg-light rounded-pill p-1" style={{ 
                        minWidth: '140px',
                        background: isDarkMode ? '#2a2a2a' : '#f0f0f0',
                        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
                    }}>
                        <button
                            type="button"
                            onClick={() => setSearchType("movies")}
                            className="btn border-0 flex-fill rounded-pill"
                            style={{
                                background: searchType === "movies" ? '#00d4ff' : 'transparent',
                                color: searchType === "movies" ? '#0a0e1a' : (isDarkMode ? '#aaa' : '#666'),
                                fontSize: '0.85rem',
                                fontWeight: searchType === "movies" ? '600' : '400',
                                padding: '0.4rem 0.75rem',
                                transition: 'all 0.3s ease',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            🎬 Movies
                        </button>
                        <button
                            type="button"
                            onClick={() => setSearchType("tv")}
                            className="btn border-0 flex-fill rounded-pill"
                            style={{
                                background: searchType === "tv" ? '#00d4ff' : 'transparent',
                                color: searchType === "tv" ? '#0a0e1a' : (isDarkMode ? '#aaa' : '#666'),
                                fontSize: '0.85rem',
                                fontWeight: searchType === "tv" ? '600' : '400',
                                padding: '0.4rem 0.75rem',
                                transition: 'all 0.3s ease',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            📺 TV Shows
                        </button>
                    </div>

                    {/* Search Input */}
                    <form onSubmit={handleSearch} className="flex-grow-1" style={{ minWidth: 0 }}>
                        <div className="input-group" style={{ borderRadius: '50px', overflow: 'hidden' }}>
                            <input
                                type="text"
                                className="form-control"
                                placeholder={`Search ${searchType === "movies" ? "movies" : "TV shows"}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRight: 'none'
                                }}
                            />
                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{
                                    borderTopLeftRadius: 0,
                                    borderBottomLeftRadius: 0,
                                    padding: '0.5rem 1rem'
                                }}
                            >
                                🔍
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="d-flex align-items-center gap-3">
                <ul className="navbar-nav flex-row align-items-center gap-3">
                    <li className="nav-item">
                        {loading ? (
                            <button className="btn btn-outline-secondary rounded-pill px-4" style={{ visibility: 'hidden' }}>Login</button>
                        ) : uid ? (
                            <button className="btn btn-outline-danger rounded-pill px-4" onClick={handleSignOut}>Logout</button>
                        ) : (
                            <button className="btn btn-outline-success rounded-pill px-4" onClick={handleLogin}>Login</button>
                        )}
                    </li>
                </ul>

                <button
                    onClick={toggleTheme}
                    className="btn btn-link nav-link p-0 d-flex align-items-center justify-content-center theme-toggle-btn"
                    style={{ transition: 'transform 0.3s ease', width: '40px', height: '40px', borderRadius: '50%', background: isDarkMode ? '#333' : '#f0f0f0' }}
                    title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                    <span style={{ fontSize: '1.2rem' }}>{isDarkMode ? '🌞' : '🌙'}</span>
                </button>
            </div>
        </nav>
    )
};

export default Navbar;