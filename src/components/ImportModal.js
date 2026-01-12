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
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '1.2rem' }}>
                    <div className="modal-header border-0 pb-0 pt-4 px-4">
                        <h5 className="modal-title fw-bold">Import into {listName || 'Vault'}</h5>
                        <button type="button" className="btn-close" onClick={onHide} aria-label="Close" disabled={isImporting}></button>
                    </div>
                    <div className="modal-body py-4 px-4">
                        <p className="text-muted small mb-2">
                            Format: <code>Title (Year) [x] {'{Rating}'}</code>
                        </p>
                        <p className="text-muted x-small mb-3" style={{ fontSize: '0.75rem' }}>
                            Tip: <code>[x]</code> marks as watched. <code>{'{10}'}</code> adds a rating.
                        </p>
                        <textarea
                            className="form-control bg-light border-0 p-3"
                            rows="10"
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                            placeholder={placeholderText}
                            disabled={isImporting}
                            style={{ borderRadius: '0.8rem', fontFamily: 'monospace', fontSize: '0.9rem' }}
                        />
                        {importStatus && (
                            <div className={`mt-3 p-2 rounded small ${importStatus.startsWith("Done") ? "bg-success-subtle text-success" : "bg-info-subtle text-info"}`} style={{ borderRadius: '0.5rem' }}>
                                {importStatus}
                            </div>
                        )}
                    </div>
                    <div className="modal-footer border-0 pt-0 pb-4 px-4 d-flex gap-2">
                        <button className="btn btn-light border-0 px-4 py-2 fw-medium flex-grow-1" onClick={onHide} disabled={isImporting} style={{ borderRadius: '0.8rem' }}>
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary px-4 py-2 fw-bold flex-grow-1"
                            onClick={onImport}
                            disabled={isImporting || !importText.trim()}
                            style={{ borderRadius: '0.8rem' }}
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
