import React from 'react';

const MoveToVaultModal = ({ show, onHide, onConfirm, itemName, type, destinations, moving }) => {
    if (!show) return null;

    const title = type === 'tv' ? 'Move Show' : 'Move Movie';

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1060 }} onClick={onHide}>
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '1.5rem', overflow: 'hidden' }}>
                    <div className="modal-header border-0 pb-0 pt-4 px-4">
                        <h5 className="modal-title fw-bold mb-0" style={{ fontSize: '1.5rem' }}>{title}</h5>
                        <button type="button" className="btn-close" onClick={onHide} aria-label="Close"></button>
                    </div>
                    <div className="modal-body py-4 px-4">
                        <p className="mb-3" style={{ fontSize: '1rem', lineHeight: '1.7', color: 'var(--text)' }}>
                            Move "<strong>{itemName}</strong>" to:
                        </p>
                        {destinations.length === 0 ? (
                            <p className="text-muted mb-0">No other vaults available. Create a new {type === 'tv' ? 'TV show' : 'movie'} vault first!</p>
                        ) : (
                            <div className="d-flex flex-column gap-2">
                                {destinations.map((dest) => (
                                    <button
                                        key={dest.id || 'default'}
                                        type="button"
                                        className="btn text-start rounded-3 px-3 py-2 fw-semibold move-destination-btn"
                                        disabled={moving}
                                        onClick={() => onConfirm(dest.id)}
                                    >
                                        <span className="me-2">{dest.icon || (dest.id ? '📁' : '🎬')}</span>
                                        {dest.name}
                                        {moving && <span className="spinner-border spinner-border-sm ms-2" role="status" aria-hidden="true"></span>}
                                    </button>
                                ))}
                            </div>
                        )}
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
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MoveToVaultModal;
