import React, { useState, useEffect } from "react";

const EditStreamingServices = ({ show, onHide, availableProviders, selectedProviders, onSave }) => {
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
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
                <div className="modal-content border-0 shadow-lg">
                    <div className="modal-header border-0 pb-0">
                        <h5 className="modal-title fw-bold">Edit Streaming Services</h5>
                        <button type="button" className="btn-close" onClick={onHide}></button>
                    </div>
                    <div className="modal-body py-4">
                        <p className="text-muted small mb-3">
                            Select the streaming services you have access to. This helps us show you where your content is available.
                        </p>
                        <div className="row g-2">
                            {availableProviders.map((provider) => (
                                <div key={provider.provider_id} className="col-6 col-md-4 col-lg-3">
                                    <div
                                        className={`p-2 border rounded d-flex align-items-center gap-2 h-100 streaming-card ${editingProviders.includes(provider.provider_name)
                                            ? 'bg-primary text-white border-primary shadow-sm'
                                            : 'bg-light hover-shadow'
                                            }`}
                                        style={{
                                            cursor: 'pointer',
                                            userSelect: 'none'
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
                    <div className="modal-footer border-0 pt-0">
                        <div className="me-auto small text-muted">
                            {editingProviders.length} services selected
                        </div>
                        <button type="button" className="btn btn-light" onClick={onHide}>Cancel</button>
                        <button type="button" className="btn btn-primary px-4 shadow-sm" onClick={handleSave}>Save & Close</button>
                    </div>
                </div>
            </div>
            <style>{`
                .streaming-card {
                    transition: all 0.2s ease;
                }
                .hover-shadow:hover {
                    background-color: #f0f0f0 !important;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                }
                .dark-mode .streaming-card {
                    border-color: rgba(255,255,255,0.1) !important;
                }
                .dark-mode .streaming-card.hover-shadow:hover {
                    background-color: #333 !important;
                }
            `}</style>
        </div>
    );
};

export default EditStreamingServices;
