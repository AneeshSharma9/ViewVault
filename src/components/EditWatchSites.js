import React, { useState, useEffect } from "react";

const EditWatchSites = ({ show, onHide, watchSites, onSave }) => {
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
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content border-0 shadow-lg">
                    <div className="modal-header border-0 pb-0">
                        <h5 className="modal-title fw-bold">Edit Watch Sites</h5>
                        <button type="button" className="btn-close" onClick={onHide}></button>
                    </div>
                    <div className="modal-body py-4" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                        <p className="text-muted small mb-4">
                            Configure external sites to search for your content. The title will be appended to the URL using the specified format.
                        </p>

                        {editingSites.map((site, index) => (
                            <div key={index} className="card mb-3 border-0 bg-light">
                                <div className="card-body p-3">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <span className="badge bg-secondary">Site {index + 1}</span>
                                        <button className="btn btn-sm btn-link text-danger text-decoration-none p-0" onClick={() => handleRemoveSite(index)}>
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
                                            />
                                        </div>
                                        <div className="col-md-5">
                                            <label className="form-label small fw-bold mb-1">Space Format</label>
                                            <select
                                                className="form-select form-select-sm border-0 shadow-sm"
                                                value={site.format}
                                                onChange={(e) => handleSiteChange(index, 'format', e.target.value)}
                                            >
                                                <option value="%20">%20 (URL Encoded)</option>
                                                <option value="-">- (Dash)</option>
                                                <option value="_">_ (Underscore)</option>
                                                <option value="+">+ (Plus)</option>
                                                <option value=" ">Space (Keep literal)</option>
                                            </select>
                                        </div>
                                        <div className="col-md-7 d-flex align-items-end pb-1">
                                            <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                                                Preview: <code className="text-primary">{site.url || '.../'}Title{site.format || ''}Sample</code>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button className="btn btn-outline-primary btn-sm w-100 py-2 border-dashed" onClick={handleAddSite} style={{ borderStyle: 'dashed' }}>
                            + Add New Watch Site
                        </button>
                    </div>
                    <div className="modal-footer border-0 pt-0">
                        <button type="button" className="btn btn-light" onClick={onHide}>Cancel</button>
                        <button type="button" className="btn btn-primary px-4 shadow-sm" onClick={handleSave}>Save & Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditWatchSites;
