import { auth, signInWithGooglePopup } from "../utils/firebase"
import { signOut } from "firebase/auth";
import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";

const Navbar = ({ onToggleSidebar }) => {
    const { isDarkMode, toggleTheme } = useTheme();
    const [uid, setUid] = useState(null);
    const [loading, setLoading] = useState(true);
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

    return (
        <nav className={`navbar sticky-top ${isDarkMode ? 'navbar-dark' : 'navbar-light'} navbar-bg px-4 py-3 shadow-sm d-flex justify-content-between align-items-center`}>
            <div className="d-flex align-items-center gap-3 flex-grow-1">
                <button
                    className="btn btn-link d-lg-none p-0 text-muted"
                    onClick={onToggleSidebar}
                    style={{ fontSize: '1.5rem', textDecoration: 'none' }}
                >
                    ☰
                </button>

                {/* Search Placeholder for now */}
                <div className="search-bar-mini d-none d-md-flex align-items-center px-3 py-2 rounded-pill bg-light bg-opacity-10 border border-white border-opacity-10"
                    style={{ minWidth: '300px', cursor: 'pointer' }}
                    onClick={() => navigate('/searchmovie')}>
                    <span className="me-2">🔍</span>
                    <span className="text-muted small">Search for movies or shows...</span>
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