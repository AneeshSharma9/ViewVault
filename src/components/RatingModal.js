import React, { useState, useEffect } from 'react';

const RatingModal = ({ show, onHide, onSave, itemName, type }) => {
    const [rating, setRating] = useState("");

    // Reset rating when modal is shown
    useEffect(() => {
        if (show) {
            setRating("");
        }
    }, [show]);

    if (!show) return null;

    const title = type === 'tv' ? 'Rate Show' : 'Rate Movie';

    const handleRatingChange = (e) => {
        const val = e.target.value;
        if (val === "") {
            setRating("");
            return;
        }

        // Basic validation
        const num = parseFloat(val);
        if (val.includes("-")) return;
        if (num < 0 || num > 10) return;

        // Limit to 1 decimal place during input
        const parts = val.split('.');
        if (parts.length === 2 && parts[1].length > 1) return;

        setRating(val);
    }

    const handleIncrement = () => {
        let currentVal = parseFloat(rating) || 0;
        if (currentVal < 10) {
            currentVal = Math.min(10, Math.round((currentVal + 0.1) * 10) / 10);
            setRating(currentVal.toString());
        }
    };

    const handleDecrement = () => {
        let currentVal = parseFloat(rating) || 0;
        if (currentVal > 0) {
            currentVal = Math.max(0, Math.round((currentVal - 0.1) * 10) / 10);
            setRating(currentVal.toString());
        }
    };

    const handleConfirm = () => {
        let ratingVal = parseFloat(rating);
        if (isNaN(ratingVal) || ratingVal < 0) ratingVal = 0;
        if (ratingVal > 10) ratingVal = 10;

        // Final rounding
        ratingVal = Math.round(ratingVal * 10) / 10;
        onSave(ratingVal);
    };

    return (
        <>
            <style>{`
                .rating-modal-input::-webkit-outer-spin-button,
                .rating-modal-input::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                .rating-modal-input[type=number] {
                    -moz-appearance: textfield;
                }
            `}</style>
            <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1060 }} onClick={onHide}>
                <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
                    <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '1.5rem', overflow: 'hidden' }}>
                        <div className="modal-header border-0 pb-0 pt-4 px-4">
                            <h5 className="modal-title fw-bold mb-0" style={{ fontSize: '1.5rem' }}>{title}</h5>
                            <button type="button" className="btn-close" onClick={onHide} aria-label="Close"></button>
                        </div>
                        <div className="modal-body py-4 px-4">
                        <p className="mb-4" style={{ fontSize: '1rem', color: 'var(--text)', lineHeight: '1.6' }}>
                            How would you rate <strong>{itemName}</strong>?
                        </p>
                        <div className="mb-3" style={{ maxWidth: '300px', margin: '0 auto' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <button
                                    type="button"
                                    onClick={handleDecrement}
                                    disabled={!rating || parseFloat(rating) <= 0}
                                    style={{
                                        width: '45px',
                                        height: '45px',
                                        borderRadius: '1rem',
                                        border: '2px solid rgba(var(--secondary-rgb), 0.3)',
                                        backgroundColor: 'var(--background)',
                                        color: 'var(--secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: (!rating || parseFloat(rating) <= 0) ? 'not-allowed' : 'pointer',
                                        opacity: (!rating || parseFloat(rating) <= 0) ? 0.5 : 1,
                                        transition: 'all 0.2s ease',
                                        fontSize: '1.5rem',
                                        fontWeight: 'bold',
                                        flexShrink: 0
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!(!rating || parseFloat(rating) <= 0)) {
                                            e.target.style.backgroundColor = 'rgba(var(--secondary-rgb), 0.1)';
                                            e.target.style.borderColor = 'var(--secondary)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!(!rating || parseFloat(rating) <= 0)) {
                                            e.target.style.backgroundColor = 'var(--background)';
                                            e.target.style.borderColor = 'rgba(var(--secondary-rgb), 0.3)';
                                        }
                                    }}
                                >
                                    −
                                </button>
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                                    <input
                                        type="number"
                                        className="form-control form-control-lg text-center fw-bold rating-modal-input"
                                        placeholder="0.0"
                                        step="0.1"
                                        min="0"
                                        max="10"
                                        value={rating}
                                        onChange={handleRatingChange}
                                        autoFocus
                                        style={{ 
                                            borderRadius: '1rem',
                                            fontSize: '1.5rem',
                                            padding: '0.75rem 1rem',
                                            backgroundColor: 'var(--background)',
                                            color: 'var(--text)',
                                            border: '2px solid rgba(var(--secondary-rgb), 0.3)',
                                            width: '100%'
                                        }}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleIncrement}
                                    disabled={rating && parseFloat(rating) >= 10}
                                    style={{
                                        width: '45px',
                                        height: '45px',
                                        borderRadius: '1rem',
                                        border: '2px solid rgba(var(--secondary-rgb), 0.3)',
                                        backgroundColor: 'var(--background)',
                                        color: 'var(--secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: (rating && parseFloat(rating) >= 10) ? 'not-allowed' : 'pointer',
                                        opacity: (rating && parseFloat(rating) >= 10) ? 0.5 : 1,
                                        transition: 'all 0.2s ease',
                                        fontSize: '1.5rem',
                                        fontWeight: 'bold',
                                        flexShrink: 0
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!(rating && parseFloat(rating) >= 10)) {
                                            e.target.style.backgroundColor = 'rgba(var(--secondary-rgb), 0.1)';
                                            e.target.style.borderColor = 'var(--secondary)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!(rating && parseFloat(rating) >= 10)) {
                                            e.target.style.backgroundColor = 'var(--background)';
                                            e.target.style.borderColor = 'rgba(var(--secondary-rgb), 0.3)';
                                        }
                                    }}
                                >
                                    +
                                </button>
                                <span 
                                    className="fw-bold" 
                                    style={{ 
                                        borderRadius: '1rem',
                                        backgroundColor: 'var(--secondary)',
                                        color: 'white',
                                        fontSize: '1.2rem',
                                        padding: '0.75rem 1rem',
                                        border: '2px solid var(--secondary)',
                                        whiteSpace: 'nowrap',
                                        marginLeft: '0.5rem'
                                    }}
                                >
                                    / 10
                                </span>
                            </div>
                        </div>
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
                            onClick={handleConfirm}
                            style={{ 
                                backgroundColor: 'var(--secondary)', 
                                borderColor: 'var(--secondary)', 
                                color: 'white'
                            }}
                        >
                            Save & Mark Watched
                        </button>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};

export default RatingModal;
