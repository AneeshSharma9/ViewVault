import React from 'react';

const ClearVaultModal = ({ show, onHide, onConfirm, listName }) => {
    if (!show) return null;

    const itemName = listName || 'vault';

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '1.2rem' }}>
                    <div className="modal-header border-0 pb-0 pt-4 px-4">
                        <h5 className="modal-title fw-bold text-danger">Clear Vault</h5>
                        <button type="button" className="btn-close" onClick={onHide} aria-label="Close"></button>
                    </div>
                    <div className="modal-body py-4 px-4">
                        <p className="mb-0 fs-5">
                            Are you sure you want to permanently clear <strong>{itemName}</strong>?
                        </p>
                        <p className="text-muted mt-2 mb-0">
                            This action cannot be undone.
                        </p>
                    </div>
                    <div className="modal-footer border-0 pt-0 pb-4 px-4">
                        <button className="btn btn-light border-0 px-4 py-2 fw-medium" onClick={onHide} style={{ borderRadius: '0.8rem' }}>
                            Cancel
                        </button>
                        <button className="btn btn-danger px-4 py-2 fw-bold" onClick={onConfirm} style={{ borderRadius: '0.8rem' }}>
                            Clear All
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClearVaultModal;
