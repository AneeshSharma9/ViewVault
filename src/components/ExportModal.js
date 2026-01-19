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
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1060 }} onClick={onHide}>
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '1.5rem', overflow: 'hidden' }}>
                    <div className="modal-header border-0 pb-0 pt-4 px-4">
                        <h5 className="modal-title fw-bold mb-0" style={{ fontSize: '1.5rem' }}>Export {listName || 'Vault'}</h5>
                        <button type="button" className="btn-close" onClick={onHide} aria-label="Close"></button>
                    </div>
                    <div className="modal-body py-4 px-4">
                        <p className="mb-3" style={{ fontSize: '0.9rem', color: 'var(--text)', opacity: 0.7 }}>
                            You can copy this text to backup your vault or import it into another account.
                        </p>
                        <textarea
                            className="form-control border-0 p-3"
                            rows="10"
                            readOnly
                            value={exportText}
                            style={{ 
                                borderRadius: '1rem', 
                                fontFamily: 'monospace', 
                                fontSize: '0.9rem',
                                backgroundColor: 'var(--background)',
                                color: 'var(--text)'
                            }}
                        />
                        <button
                            className={`btn w-100 mt-3 py-2 fw-bold rounded-pill`}
                            onClick={handleCopy}
                            style={{ 
                                backgroundColor: copied ? '#28a745' : 'var(--secondary)', 
                                borderColor: copied ? '#28a745' : 'var(--secondary)',
                                color: 'white',
                                transition: 'all 0.3s ease' 
                            }}
                        >
                            {copied ? '✓ Copied to Clipboard!' : 'Copy to Clipboard'}
                        </button>
                    </div>
                    <div className="modal-footer border-0 pt-0 pb-4 px-4">
                        <button 
                            className="btn rounded-pill px-4 fw-medium" 
                            onClick={onHide}
                            style={{ 
                                backgroundColor: 'var(--background)', 
                                border: '1px solid rgba(var(--text-rgb), 0.2)',
                                color: 'var(--text)'
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExportModal;
