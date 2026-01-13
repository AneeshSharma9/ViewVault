import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import useUserVaults from '../hooks/useUserVaults';
import { db } from '../utils/firebase';
import { ref, push } from 'firebase/database';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose, width, onResizeStart }) => {
    const { customVaults, uid } = useUserVaults();
    const location = useLocation();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newListName, setNewListName] = useState("");
    const [newListType, setNewListType] = useState("movies");

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

    const getTypeIcon = (type) => {
        switch (type) {
            case 'movies': return '🎬';
            case 'tvshows': return '📺';
            default: return '📋';
        }
    };

    const handleNavClick = () => {
        if (window.innerWidth <= 991.98) {
            onClose();
        }
    };

    return (
        <>
            <aside
                className={`sidebar ${isOpen ? 'open' : ''}`}
                style={{ width: isOpen ? `${width}px` : '0px' }}
            >
                <div className="sidebar-resizer" onMouseDown={onResizeStart} />
                <div className="sidebar-content">
                    <div className="sidebar-header d-flex justify-content-between align-items-center">
                        <a href="/" className="sidebar-logo">ViewVault</a>
                        <button className="btn d-lg-none p-0 text-muted" onClick={onClose} style={{ fontSize: '1.5rem' }}>
                            ✕
                        </button>
                    </div>

                    <div className="sidebar-section">
                        <h3 className="sidebar-section-title">My Library</h3>
                        <ul className="sidebar-nav">
                            <li className="sidebar-nav-item">
                                <NavLink to="/movies" onClick={handleNavClick} className={({ isActive }) => `sidebar-link ${isActive && !location.search ? 'active' : ''}`}>
                                    <span className="sidebar-link-icon">🎬</span>
                                    <span>Movie Vault</span>
                                </NavLink>
                            </li>
                            <li className="sidebar-nav-item">
                                <NavLink to="/tvshows" onClick={handleNavClick} className={({ isActive }) => `sidebar-link ${isActive && !location.search ? 'active' : ''}`}>
                                    <span className="sidebar-link-icon">📺</span>
                                    <span>TV Vault</span>
                                </NavLink>
                            </li>
                        </ul>
                    </div>

                    <div className="sidebar-section">
                        <h3 className="sidebar-section-title">Discover</h3>
                        <ul className="sidebar-nav">
                            <li className="sidebar-nav-item">
                                <NavLink to="/searchmovie" onClick={handleNavClick} className="sidebar-link">
                                    <span className="sidebar-link-icon">🔍</span>
                                    <span>Search Movies</span>
                                </NavLink>
                            </li>
                            <li className="sidebar-nav-item">
                                <NavLink to="/searchtv" onClick={handleNavClick} className="sidebar-link">
                                    <span className="sidebar-link-icon">🔍</span>
                                    <span>Search TV</span>
                                </NavLink>
                            </li>
                            <li className="sidebar-nav-item">
                                <NavLink to="/movienyte" onClick={handleNavClick} className="sidebar-link">
                                    <span className="sidebar-link-icon">🍿</span>
                                    <span>MovieNyte™</span>
                                </NavLink>
                            </li>
                        </ul>
                    </div>

                    <div className="sidebar-section sidebar-custom-vaults">
                        <h3 className="sidebar-section-title">Custom Vaults</h3>
                        <ul className="sidebar-nav">
                            {customVaults.length > 0 ? (
                                customVaults.map(vault => (
                                    <li key={vault.id} className="sidebar-nav-item">
                                        <NavLink
                                            to={`/${vault.type === 'movies' ? 'movies' : 'tvshows'}?list=${vault.id}`}
                                            onClick={handleNavClick}
                                            className={({ isActive }) => `sidebar-link ${isActive && location.search.includes(vault.id) ? 'active' : ''}`}
                                        >
                                            <span className="sidebar-link-icon">{getTypeIcon(vault.type)}</span>
                                            <span className="text-truncate">{vault.name}</span>
                                        </NavLink>
                                    </li>
                                ))
                            ) : (
                                <li className="sidebar-nav-item px-3 small opacity-50">Log in to see your custom vaults</li>
                            )}
                        </ul>
                    </div>

                    <div className="sidebar-footer">
                        <button
                            className="btn btn-premium btn-premium-primary create-vault-btn d-flex align-items-center gap-2"
                            onClick={() => {
                                setShowCreateModal(true);
                                handleNavClick();
                            }}
                            disabled={!uid}
                        >
                            <span>+</span>
                            <span>Create Vault</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Create Vault Modal */}
            {showCreateModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 2000 }} onClick={() => setShowCreateModal(false)}>
                    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '1.5rem', overflow: 'hidden' }}>
                            <div className="modal-header border-0 pb-0 pt-4 px-4">
                                <h5 className="modal-title fw-bold mb-0" style={{ fontSize: '1.5rem' }}>Create New Vault</h5>
                                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
                            </div>
                            <div className="modal-body py-4 px-4">
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Vault Name</label>
                                    <input
                                        type="text"
                                        className="form-control rounded-pill"
                                        value={newListName}
                                        onChange={(e) => setNewListName(e.target.value)}
                                        placeholder="My Epic Collection"
                                        style={{ padding: '0.6rem 1.2rem' }}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Vault Type</label>
                                    <div className="d-flex gap-2">
                                        <button
                                            className={`btn flex-grow-1 rounded-pill fw-medium`}
                                            onClick={() => setNewListType('movies')}
                                            style={{
                                                backgroundColor: newListType === 'movies' ? 'var(--secondary)' : 'var(--background)',
                                                color: newListType === 'movies' ? 'white' : 'var(--text)',
                                                border: 'none'
                                            }}
                                        >
                                            🎬 Movies
                                        </button>
                                        <button
                                            className={`btn flex-grow-1 rounded-pill fw-medium`}
                                            onClick={() => setNewListType('tvshows')}
                                            style={{
                                                backgroundColor: newListType === 'tvshows' ? 'var(--secondary)' : 'var(--background)',
                                                color: newListType === 'tvshows' ? 'white' : 'var(--text)',
                                                border: 'none'
                                            }}
                                        >
                                            📺 TV Shows
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-0 pt-0 pb-4 px-4 d-flex gap-2">
                                <button 
                                    type="button" 
                                    className="btn rounded-pill px-4 fw-medium" 
                                    onClick={() => setShowCreateModal(false)}
                                    style={{ 
                                        backgroundColor: 'var(--background)', 
                                        border: '1px solid rgba(var(--text-rgb), 0.2)',
                                        color: 'var(--text)'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn rounded-pill px-4 fw-bold"
                                    onClick={handleCreateVault}
                                    disabled={!newListName.trim()}
                                    style={{ 
                                        backgroundColor: 'var(--secondary)', 
                                        borderColor: 'var(--secondary)', 
                                        color: 'white',
                                        opacity: !newListName.trim() ? 0.5 : 1
                                    }}
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

export default Sidebar;
