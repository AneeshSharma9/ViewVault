import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

const EditWatchSites = ({ show, onHide, watchSites, onSave }) => {
    const { isDarkMode } = useTheme();
    const [editingSites, setEditingSites] = useState([]);

    useEffect(() => {
        if (show) {
            setEditingSites(JSON.parse(JSON.stringify(watchSites)));
        }
    }, [show, watchSites]);

    const handleSiteChange = (index, field, value) => {
        const updated = [...editingSites];
        updated[index][field] = value;
        setEditingSites(updated);
    };

    const handleAddSite = () => {
        setEditingSites([...editingSites, { name: "", url: "", format: "%20" }]);
    };

    const handleRemoveSite = (index) => {
        setEditingSites(editingSites.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        onSave(editingSites);
        onHide();
    };

    if (!show) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1060 }} onClick={onHide}>
            <div className="modal-dialog modal-dialog-centered modal-lg" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '1.5rem', overflow: 'hidden' }}>
                    <style>{`
                        .edit-watch-sites-input .form-control,
                        .edit-watch-sites-input .form-select {
                            background-color: ${isDarkMode ? '#1e1e1e' : '#ffffff'} !important;
                            color: ${isDarkMode ? '#f0f0f0' : 'inherit'} !important;
                            border: ${isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'} !important;
                        }
                        .edit-watch-sites-input .form-control:focus,
                        .edit-watch-sites-input .form-select:focus {
                            background-color: ${isDarkMode ? '#222222' : '#ffffff'} !important;
                        }
                    `}</style>
                    <div className="modal-header border-0 pb-0 pt-4 px-4">
                        <h5 className="modal-title fw-bold mb-0" style={{ fontSize: '1.5rem' }}>Edit Watch Sites</h5>
                        <button type="button" className="btn-close" onClick={onHide}></button>
                    </div>
                    <div className="modal-body py-4 px-4 edit-watch-sites-input" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                        <p className="mb-4" style={{ fontSize: '0.9rem', color: 'var(--text)', opacity: 0.7 }}>
                            Configure external sites to search for your content. The title will be appended to the URL using the specified format.
                        </p>

                        {editingSites.map((site, index) => (
                            <div 
                                key={index} 
                                className="mb-3" 
                                style={{ 
                                    backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5', 
                                    borderRadius: '1rem',
                                    padding: '1rem',
                                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                                    boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.05)'
                                }}
                            >
                                <div>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <span className="badge bg-secondary">Site {index + 1}</span>
                                        <button 
                                            className="btn btn-sm btn-link text-decoration-none p-0" 
                                            onClick={() => handleRemoveSite(index)}
                                            style={{ color: 'var(--secondary)' }}
                                        >
                                            <i className="bi bi-trash me-1"></i>Remove
                                        </button>
                                    </div>
                                    <div className="row g-3">
                                        <div className="col-md-4">
                                            <label className="form-label small fw-bold mb-1">Name</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm border-0 shadow-sm"
                                                value={site.name}
                                                onChange={(e) => handleSiteChange(index, 'name', e.target.value)}
                                                placeholder="e.g. Lookmovie"
                                                style={{ 
                                                    backgroundColor: isDarkMode ? '#151515 !important' : '#ffffff', 
                                                    color: isDarkMode ? '#f0f0f0' : 'inherit',
                                                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
                                                }}
                                            />
                                        </div>
                                        <div className="col-md-8">
                                            <label className="form-label small fw-bold mb-1">Search URL</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm border-0 shadow-sm"
                                                value={site.url}
                                                onChange={(e) => handleSiteChange(index, 'url', e.target.value)}
                                                placeholder="https://example.com/search?q="
                                                style={{ 
                                                    backgroundColor: isDarkMode ? '#151515 !important' : '#ffffff', 
                                                    color: isDarkMode ? '#f0f0f0' : 'inherit',
                                                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
                                                }}
                                            />
                                        </div>
                                        <div className="col-md-5">
                                            <label className="form-label small fw-bold mb-1">Space Format</label>
                                            <select
                                                className="form-select form-select-sm border-0 shadow-sm"
                                                value={site.format}
                                                onChange={(e) => handleSiteChange(index, 'format', e.target.value)}
                                                style={{ 
                                                    backgroundColor: isDarkMode ? '#151515 !important' : '#ffffff', 
                                                    color: isDarkMode ? '#f0f0f0' : 'inherit',
                                                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
                                                }}
                                            >
                                                <option value="%20">%20 (URL Encoded)</option>
                                                <option value="-">- (Dash)</option>
                                                <option value="_">_ (Underscore)</option>
                                                <option value="+">+ (Plus)</option>
                                                <option value=" ">Space (Keep literal)</option>
                                            </select>
                                        </div>
                                        <div className="col-md-7 d-flex align-items-end pb-1">
                                            <div className="small" style={{ fontSize: '0.75rem', color: 'var(--text)' }}>
                                                Preview: <code style={{ color: 'var(--secondary)', fontWeight: '600' }}>{site.url || '.../'}Title{site.format || ''}Sample</code>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button 
                            className="btn btn-sm w-100 py-2 rounded-pill" 
                            onClick={handleAddSite} 
                            style={{ 
                                borderStyle: 'dashed', 
                                border: '2px dashed rgba(var(--secondary-rgb), 0.3)',
                                backgroundColor: 'transparent',
                                color: 'var(--secondary)',
                                fontWeight: '600'
                            }}
                        >
                            + Add New Watch Site
                        </button>
                    </div>
                    <div className="modal-footer border-0 pt-0 pb-4 px-4 d-flex gap-2">
                        <button 
                            type="button" 
                            className="btn rounded-pill px-4 fw-medium" 
                            onClick={onHide}
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
                            onClick={handleSave}
                            style={{ 
                                backgroundColor: 'var(--secondary)', 
                                borderColor: 'var(--secondary)', 
                                color: 'white'
                            }}
                        >
                            Save & Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditWatchSites;
