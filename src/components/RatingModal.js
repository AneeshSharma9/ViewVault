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

    const handleConfirm = () => {
        let ratingVal = parseFloat(rating);
        if (isNaN(ratingVal) || ratingVal < 0) ratingVal = 0;
        if (ratingVal > 10) ratingVal = 10;

        // Final rounding
        ratingVal = Math.round(ratingVal * 10) / 10;
        onSave(ratingVal);
    };

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '1.2rem' }}>
                    <div className="modal-header border-0 pb-0 pt-4 px-4">
                        <h5 className="modal-title fw-bold">{title}</h5>
                        <button type="button" className="btn-close" onClick={onHide} aria-label="Close"></button>
                    </div>
                    <div className="modal-body py-4 px-4">
                        <p className="mb-3 text-muted">How would you rate <strong>{itemName}</strong>?</p>
                        <div className="input-group mb-2">
                            <input
                                type="number"
                                className="form-control form-control-lg text-center fw-bold"
                                placeholder="0.0 - 10"
                                step="0.1"
                                min="0"
                                max="10"
                                value={rating}
                                onChange={handleRatingChange}
                                autoFocus
                                style={{ borderRadius: '0.8rem 0 0 0.8rem', borderRight: 'none' }}
                            />
                            <span className="input-group-text bg-warning text-dark fw-bold border-0" style={{ borderRadius: '0 0.8rem 0.8rem 0' }}>
                                / 10
                            </span>
                        </div>
                    </div>
                    <div className="modal-footer border-0 pt-0 pb-4 px-4">
                        <button className="btn btn-light border-0 px-4 py-2 fw-medium" onClick={onHide} style={{ borderRadius: '0.8rem' }}>
                            Cancel
                        </button>
                        <button className="btn btn-primary px-4 py-2 fw-bold" onClick={handleConfirm} style={{ borderRadius: '0.8rem' }}>
                            Save & Mark Watched
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RatingModal;
