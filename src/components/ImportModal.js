import React from 'react';

const ImportModal = ({
    show,
    onHide,
    importText,
    setImportText,
    onImport,
    isImporting,
    importStatus,
    listName,
    type // 'movies' or 'tv'
}) => {
    if (!show) return null;

    const placeholderText = type === 'tv'
        ? "Breaking Bad (2008) [x] {10}\nSuccession (2018) []"
        : "The Matrix (1999) [x] {10}\nInception (2010)";

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1060 }} onClick={onHide}>
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '1.5rem', overflow: 'hidden' }}>
                    <div className="modal-header border-0 pb-0 pt-4 px-4">
                        <h5 className="modal-title fw-bold mb-0" style={{ fontSize: '1.5rem' }}>Import into {listName || 'Vault'}</h5>
                        <button type="button" className="btn-close" onClick={onHide} aria-label="Close" disabled={isImporting}></button>
                    </div>
                    <div className="modal-body py-4 px-4">
                        <p className="mb-2" style={{ fontSize: '0.9rem', color: 'var(--text)', opacity: 0.7 }}>
                            Format: <code style={{ color: 'var(--secondary)', fontWeight: '600' }}>Title (Year) [x] {'{Rating}'}</code>
                        </p>
                        <p className="mb-3" style={{ fontSize: '0.75rem', color: 'var(--text)', opacity: 0.6 }}>
                            Tip: <code style={{ color: 'var(--secondary)' }}>[x]</code> marks as watched. <code style={{ color: 'var(--secondary)' }}>{'{10}'}</code> adds a rating.
                        </p>
                        <textarea
                            className="form-control border-0 p-3"
                            rows="10"
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                            placeholder={placeholderText}
                            disabled={isImporting}
                            style={{ 
                                borderRadius: '1rem', 
                                fontFamily: 'monospace', 
                                fontSize: '0.9rem',
                                backgroundColor: 'var(--background)',
                                color: 'var(--text)'
                            }}
                        />
                        {importStatus && (
                            <div className={`mt-3 p-3 rounded small ${importStatus.startsWith("Done") ? "text-success" : "text-info"}`} style={{ 
                                borderRadius: '0.8rem',
                                backgroundColor: importStatus.startsWith("Done") ? 'rgba(40, 167, 69, 0.1)' : 'rgba(0, 123, 255, 0.1)'
                            }}>
                                {importStatus}
                            </div>
                        )}
                    </div>
                    <div className="modal-footer border-0 pt-0 pb-4 px-4 d-flex gap-2">
                        <button 
                            className="btn rounded-pill px-4 fw-medium flex-grow-1" 
                            onClick={onHide} 
                            disabled={isImporting}
                            style={{ 
                                backgroundColor: 'var(--background)', 
                                border: '1px solid rgba(var(--text-rgb), 0.2)',
                                color: 'var(--text)',
                                opacity: isImporting ? 0.5 : 1
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn rounded-pill px-4 fw-bold flex-grow-1"
                            onClick={onImport}
                            disabled={isImporting || !importText.trim()}
                            style={{ 
                                backgroundColor: 'var(--secondary)', 
                                borderColor: 'var(--secondary)', 
                                color: 'white',
                                opacity: (isImporting || !importText.trim()) ? 0.5 : 1
                            }}
                        >
                            {isImporting ? (
                                <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Importing...</>
                            ) : "Import Now"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportModal;
