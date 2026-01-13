import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

const EditStreamingServices = ({ show, onHide, availableProviders, selectedProviders, onSave }) => {
    const { isDarkMode } = useTheme();
    const [editingProviders, setEditingProviders] = useState([]);

    useEffect(() => {
        if (show) {
            setEditingProviders([...selectedProviders]);
        }
    }, [show, selectedProviders]);

    const handleToggle = (providerName) => {
        setEditingProviders(prev =>
            prev.includes(providerName)
                ? prev.filter(p => p !== providerName)
                : [...prev, providerName]
        );
    };

    const handleSave = () => {
        onSave(editingProviders);
        onHide();
    };

    if (!show) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1060 }} onClick={onHide}>
            <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '1.5rem', overflow: 'hidden' }}>
                    <div className="modal-header border-0 pb-0 pt-4 px-4">
                        <h5 className="modal-title fw-bold mb-0" style={{ fontSize: '1.5rem' }}>Edit Streaming Services</h5>
                        <button type="button" className="btn-close" onClick={onHide}></button>
                    </div>
                    <div className="modal-body py-4 px-4">
                        <p className="mb-3" style={{ fontSize: '0.9rem', color: 'var(--text)', opacity: 0.7 }}>
                            Select the streaming services you have access to. This helps us show you where your content is available.
                        </p>
                        <div className="row g-2">
                            {availableProviders.map((provider) => (
                                <div key={provider.provider_id} className="col-6 col-md-4 col-lg-3">
                                    <div
                                        className={`p-2 rounded d-flex align-items-center gap-2 h-100 streaming-card ${editingProviders.includes(provider.provider_name)
                                            ? 'shadow-sm'
                                            : 'hover-shadow'
                                            }`}
                                        style={{
                                            cursor: 'pointer',
                                            userSelect: 'none',
                                            backgroundColor: editingProviders.includes(provider.provider_name) ? 'var(--secondary)' : 'var(--background)',
                                            border: editingProviders.includes(provider.provider_name) ? `1px solid var(--secondary)` : (isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(var(--text-rgb), 0.1)'),
                                            color: editingProviders.includes(provider.provider_name) ? 'white' : 'var(--text)'
                                        }}
                                        onClick={() => handleToggle(provider.provider_name)}
                                    >
                                        {provider.logo_path && (
                                            <img
                                                src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                                                style={{ width: '24px', height: '24px' }}
                                                className="rounded shadow-sm"
                                                alt=""
                                            />
                                        )}
                                        <span className="small text-truncate fw-medium">
                                            {provider.provider_name}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="modal-footer border-0 pt-0 pb-4 px-4 d-flex justify-content-between align-items-center">
                        <div className="small" style={{ color: 'var(--text)', opacity: 0.7 }}>
                            {editingProviders.length} services selected
                        </div>
                        <div className="d-flex gap-2">
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
            <style>{`
                .streaming-card {
                    transition: all 0.2s ease;
                }
                .hover-shadow:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    border-color: rgba(var(--secondary-rgb), 0.3) !important;
                }
            `}</style>
        </div>
    );
};

export default EditStreamingServices;
