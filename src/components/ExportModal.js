import React, { useState } from 'react';

const ExportModal = ({ show, onHide, exportText, listName }) => {
    const [copied, setCopied] = useState(false);

    if (!show) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(exportText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '1.2rem' }}>
                    <div className="modal-header border-0 pb-0 pt-4 px-4">
                        <h5 className="modal-title fw-bold">Export {listName || 'Vault'}</h5>
                        <button type="button" className="btn-close" onClick={onHide} aria-label="Close"></button>
                    </div>
                    <div className="modal-body py-4 px-4">
                        <p className="text-muted small mb-3">
                            You can copy this text to backup your vault or import it into another account.
                        </p>
                        <textarea
                            className="form-control bg-light border-0 p-3"
                            rows="10"
                            readOnly
                            value={exportText}
                            style={{ borderRadius: '0.8rem', fontFamily: 'monospace', fontSize: '0.9rem' }}
                        />
                        <button
                            className={`btn ${copied ? 'btn-success' : 'btn-primary'} w-100 mt-3 py-2 fw-bold`}
                            onClick={handleCopy}
                            style={{ borderRadius: '0.8rem', transition: 'all 0.3s ease' }}
                        >
                            {copied ? '✓ Copied to Clipboard!' : 'Copy to Clipboard'}
                        </button>
                    </div>
                    <div className="modal-footer border-0 pt-0 pb-4 px-4">
                        <button className="btn btn-light border-0 px-4 py-2 fw-medium" onClick={onHide} style={{ borderRadius: '0.8rem' }}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExportModal;
