import { useState, useEffect } from "react";
import { auth, db, signInWithGooglePopup } from "../utils/firebase";
import { signOut } from "firebase/auth";
import { useTheme } from "../context/ThemeContext";
import { NavLink, useLocation } from "react-router-dom";
import useUserVaults from "../hooks/useUserVaults";
import { ref, push } from "firebase/database";

const Navbar = () => {
    const { isDarkMode, toggleTheme } = useTheme();
    const [uid, setUid] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newListName, setNewListName] = useState("");
    const [newListType, setNewListType] = useState("movies");
    const { customVaults } = useUserVaults();
    const location = useLocation();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            setUid(user ? user.uid : null);
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = async () => {
        await signInWithGooglePopup();
    };

    const handleSignOut = () => {
        signOut(auth).catch((error) => console.error('Error signing out:', error.message));
        setMobileOpen(false);
    };

    const handleCreateVault = async () => {
        if (!newListName.trim() || !uid) return;
        try {
            const vaultsRef = ref(db, `users/${uid}/customwatchlists`);
            await push(vaultsRef, {
                name: newListName.trim(),
                type: newListType,
                createdAt: Date.now()
            });
            setShowCreateModal(false);
            setNewListName("");
        } catch (error) {
            console.error('Error creating vault:', error);
        }
    };

    const handleNavClick = () => setMobileOpen(false);

    const getTypeIcon = (type) => {
        switch (type) {
            case 'movies': return '🎬';
            case 'tvshows': return '📺';
            default: return '📋';
        }
    };

    const navLinkClass = ({ isActive }) => `topnav-link${isActive ? ' active' : ''}`;

    const defaultVaultLinkClass = (targetType) => ({ isActive }) => {
        const listId = new URLSearchParams(location.search).get('list');
        const isActiveTarget = isActive && !listId && location.pathname === `/${targetType}`;
        return `topnav-link${isActiveTarget ? ' active' : ''}`;
    };

    const customVaultLinkClass = (vault) => ({ isActive }) => {
        const listId = new URLSearchParams(location.search).get('list');
        const isActiveTarget = isActive && listId === vault.id && location.pathname === `/${vault.type === 'movies' ? 'movies' : 'tvshows'}`;
        return `topnav-link${isActiveTarget ? ' active' : ''}`;
    };

    const customVaultDropdownClass = (vault) => ({ isActive }) => {
        const listId = new URLSearchParams(location.search).get('list');
        const isActiveTarget = isActive && listId === vault.id && location.pathname === `/${vault.type === 'movies' ? 'movies' : 'tvshows'}`;
        return `dropdown-item${isActiveTarget ? ' active' : ''}`;
    };

    const brandImgFilter = isDarkMode ? 'none' : 'invert(1)';

    const renderAuthButton = () => {
        if (authLoading) {
            return (
                <button className="topnav-icon" style={{ visibility: 'hidden' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </button>
            );
        }
        return uid ? (
            <button className="topnav-icon" onClick={handleSignOut} title="Logout">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
            </button>
        ) : (
            <button className="topnav-icon" onClick={handleLogin} title="Login">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10 17 15 12 10 7"></polyline>
                    <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg>
            </button>
        );
    };

    return (
        <>
            <nav className="navbar sticky-top topnav navbar-bg px-3 px-md-4 py-2">
                {/* Mobile hamburger */}
                <button
                    className="topnav-hamburger d-lg-none"
                    onClick={() => setMobileOpen(o => !o)}
                    aria-label="Toggle navigation menu"
                >
                    {mobileOpen ? '✕' : '☰'}
                </button>

                {/* Brand */}
                <a href="/" className="topnav-brand" onClick={handleNavClick}>
                    <img src="/favicon_white.png" alt="ViewVault" style={{ filter: brandImgFilter }} />
                    <span>ViewVault</span>
                </a>

                {/* Desktop nav links */}
                <nav className="topnav-links d-none d-lg-flex">
                    <div className="topnav-dropdown">
                        <button className="topnav-link dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            Discover
                        </button>
                        <ul className="dropdown-menu">
                            <li><NavLink to="/searchmovie" className="dropdown-item">Search Movies</NavLink></li>
                            <li><NavLink to="/searchtv" className="dropdown-item">Search TV</NavLink></li>
                            <li><hr className="dropdown-divider opacity-10" /></li>
                            <li><NavLink to="/movienyte" className="dropdown-item">MovieNyte&trade;</NavLink></li>
                        </ul>
                    </div>

                    <NavLink to="/movies" className={defaultVaultLinkClass('movies')}>Movies</NavLink>
                    <NavLink to="/tvshows" className={defaultVaultLinkClass('tvshows')}>TV Shows</NavLink>

                    <div className="topnav-dropdown">
                        <button className="topnav-link dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            Vaults
                        </button>
                        <ul className="dropdown-menu" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                            {customVaults.length > 0 ? (
                                customVaults.map(vault => (
                                    <li key={vault.id}>
                                        <NavLink
                                            to={`/${vault.type === 'movies' ? 'movies' : 'tvshows'}?list=${vault.id}`}
                                            className={customVaultDropdownClass(vault)}
                                        >
                                            {getTypeIcon(vault.type)} {vault.name}
                                        </NavLink>
                                    </li>
                                ))
                            ) : (
                                <li>
                                    <span className="dropdown-item-text text-muted small">
                                        {uid ? 'No custom vaults yet' : 'Log in to see your vaults'}
                                    </span>
                                </li>
                            )}
                        </ul>
                    </div>
                </nav>

                {/* Actions */}
                <div className="topnav-actions">
                    <button
                        className="topnav-create d-none d-md-inline-flex"
                        onClick={() => setShowCreateModal(true)}
                        disabled={!uid}
                        title={uid ? 'Create a new vault' : 'Log in to create a vault'}
                    >
                        + New Vault
                    </button>
                    <button className="topnav-icon" onClick={toggleTheme} title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                        <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{isDarkMode ? '🌞' : '🌙'}</span>
                    </button>
                    {renderAuthButton()}
                </div>

                {/* Mobile collapse menu — rendered inside the sticky nav so it
                    stays pinned below the bar when the page is scrolled */}
                {mobileOpen && (
                    <div className="topnav-mobile d-lg-none navbar-bg">
                        <nav className="topnav-mobile-links">
                            <div className="topnav-mobile-sep">Discover</div>
                            <NavLink to="/searchmovie" className={navLinkClass} onClick={handleNavClick}>Search Movies</NavLink>
                            <NavLink to="/searchtv" className={navLinkClass} onClick={handleNavClick}>Search TV</NavLink>
                            <NavLink to="/movienyte" className={navLinkClass} onClick={handleNavClick}>MovieNyte&trade;</NavLink>
                            <div className="topnav-mobile-sep">Vaults</div>
                            <NavLink to="/movies" className={defaultVaultLinkClass('movies')} onClick={handleNavClick}>🎬 Movies</NavLink>
                            <NavLink to="/tvshows" className={defaultVaultLinkClass('tvshows')} onClick={handleNavClick}>📺 TV Shows</NavLink>
                            {customVaults.length > 0 ? (
                                customVaults.map(vault => (
                                    <NavLink
                                        key={vault.id}
                                        to={`/${vault.type === 'movies' ? 'movies' : 'tvshows'}?list=${vault.id}`}
                                        className={customVaultLinkClass(vault)}
                                        onClick={handleNavClick}
                                    >
                                        {getTypeIcon(vault.type)} {vault.name}
                                    </NavLink>
                                ))
                            ) : (
                                <div className="topnav-mobile-empty">
                                    {uid ? 'No custom vaults yet' : 'Log in to see your vaults'}
                                </div>
                            )}
                            <button
                                className="topnav-create w-100 justify-content-center mt-2"
                                onClick={() => { setShowCreateModal(true); setMobileOpen(false); }}
                                disabled={!uid}
                            >
                                + New Vault
                            </button>
                        </nav>
                    </div>
                )}
            </nav>

            {/* Create Vault Modal */}
            {showCreateModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 2000 }} onClick={() => setShowCreateModal(false)}>
                    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header border-0 pb-0 pt-4 px-4">
                                <h5 className="modal-title mb-0" style={{ fontSize: '1.3rem' }}>Create New Vault</h5>
                                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
                            </div>
                            <div className="modal-body py-4 px-4">
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Vault Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={newListName}
                                        onChange={(e) => setNewListName(e.target.value)}
                                        placeholder="My Epic Collection"
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleCreateVault(); }}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Vault Type</label>
                                    <div className="d-flex gap-2">
                                        <button
                                            className={`btn flex-grow-1 fw-medium ${newListType === 'movies' ? 'btn-solid' : 'btn-ghost-inline'}`}
                                            onClick={() => setNewListType('movies')}
                                        >
                                            🎬 Movies
                                        </button>
                                        <button
                                            className={`btn flex-grow-1 fw-medium ${newListType === 'tvshows' ? 'btn-solid' : 'btn-ghost-inline'}`}
                                            onClick={() => setNewListType('tvshows')}
                                        >
                                            📺 TV Shows
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-0 pt-0 pb-4 px-4 d-flex gap-2">
                                <button type="button" className="btn btn-outline-secondary btn-ghost-inline px-4" onClick={() => setShowCreateModal(false)}>
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-solid px-4"
                                    onClick={handleCreateVault}
                                    disabled={!newListName.trim()}
                                    style={{ opacity: !newListName.trim() ? 0.5 : 1 }}
                                >
                                    Create Vault
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;