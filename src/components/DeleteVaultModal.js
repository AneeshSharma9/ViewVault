import React from 'react';

const DeleteVaultModal = ({ show, onHide, onConfirm, listName }) => {
    if (!show) return null;

    const itemName = listName || 'vault';

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1060 }} onClick={onHide}>
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '1.5rem', overflow: 'hidden' }}>
                    <div className="modal-header border-0 pb-0 pt-4 px-4">
                        <h5 className="modal-title fw-bold mb-0" style={{ fontSize: '1.5rem', color: 'var(--text)' }}>Delete Vault</h5>
                        <button type="button" className="btn-close" onClick={onHide} aria-label="Close"></button>
                    </div>
                    <div className="modal-body py-4 px-4">
                        <p className="mb-0" style={{ fontSize: '1rem', color: 'var(--text)', lineHeight: '1.6' }}>
                            Are you sure you want to permanently delete <strong>{itemName}</strong>?
                        </p>
                        <p className="text-muted mt-2 mb-0" style={{ fontSize: '0.9rem' }}>
                            This will remove the vault and all its contents. This action cannot be undone.
                        </p>
                    </div>
                    <div className="modal-footer border-0 pt-0 pb-4 px-4 d-flex gap-2">
                        <button 
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
                            className="btn rounded-pill px-4 fw-bold" 
                            onClick={onConfirm}
                            style={{ 
                                backgroundColor: '#dc3545', 
                                borderColor: '#dc3545', 
                                color: 'white'
                            }}
                        >
                            Delete Vault
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteVaultModal;

