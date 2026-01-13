import React from 'react';

const MediaFilters = ({
    sortBy,
    onSortChange,
    sortOptions = [],
    streamingFilter = [],
    selectedProviders = [],
    onSelectAllStreaming,
    onStreamingFilterToggle,
    streamingFilterButtonText,
    onImport,
    onExport,
    onEditProviders,
    onEditSites,
    onRefresh,
    isRefreshing,
    refreshStatus,
    onClear,
    anyItems,
    addLabel,
    addLink,
    searchQuery = '',
    onSearchChange
}) => {
    return (
        <div className="mb-3 d-flex flex-column flex-md-row justify-content-between gap-3 fade-in">
            <div className="d-flex gap-2 flex-wrap flex-grow-1">
                {/* Search Input */}
                <div className="flex-fill" style={{ minWidth: '200px', maxWidth: '300px' }}>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search by title..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        style={{ borderRadius: '0.8rem', height: '38px' }}
                    />
                </div>

                {/* Sort Dropdown */}
                <div className="dropdown flex-fill">
                    <button className="btn btn-outline-secondary dropdown-toggle w-100" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                        {sortBy}
                    </button>
                    <ul className="dropdown-menu shadow-lg" style={{ borderRadius: '0.8rem' }}>
                        {sortOptions.map(option => (
                            <li key={option}>
                                <button className="dropdown-item py-2" onClick={() => onSortChange(option)}>
                                    {option}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Streaming Filter Dropdown */}
                <div className="dropdown flex-fill">
                    <button className="btn btn-outline-secondary dropdown-toggle w-100" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                        {streamingFilterButtonText}
                    </button>
                    <ul className="dropdown-menu shadow-lg" style={{ minWidth: '220px', maxHeight: '350px', overflowY: 'auto', borderRadius: '0.8rem' }}>
                        <li>
                            <label className="dropdown-item py-2" style={{ cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    className="form-check-input me-3"
                                    checked={streamingFilter.length === 0 || (streamingFilter.length === selectedProviders.length && selectedProviders.length > 0)}
                                    onChange={onSelectAllStreaming}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <span className="fw-bold">All Services</span>
                            </label>
                        </li>
                        {selectedProviders.length > 0 && <li><hr className="dropdown-divider opacity-10" /></li>}
                        {selectedProviders.length > 0 ? (
                            selectedProviders.map((provider) => (
                                <li key={provider}>
                                    <label className="dropdown-item py-2" style={{ cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            className="form-check-input me-3"
                                            checked={streamingFilter.includes(provider)}
                                            onChange={() => onStreamingFilterToggle(provider)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        {provider}
                                    </label>
                                </li>
                            ))
                        ) : (
                            <li><span className="dropdown-item-text text-muted small py-3">No services enabled</span></li>
                        )}
                    </ul>
                </div>

                {/* Utility Dropdown */}
                <div className="dropdown flex-fill">
                    <button className="btn btn-outline-secondary dropdown-toggle w-100" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                        ⋯
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end shadow-lg" style={{ borderRadius: '0.8rem', minWidth: '200px' }}>
                        <li><button className="dropdown-item py-2" onClick={onImport}>Import Vault</button></li>
                        <li><button className="dropdown-item py-2" onClick={onExport}>Export Vault</button></li>
                        <li><hr className="dropdown-divider opacity-10" /></li>
                        <li><button className="dropdown-item py-2" onClick={onEditProviders}>Edit Streaming Services</button></li>
                        <li><button className="dropdown-item py-2" onClick={onEditSites}>Edit Watch Sites</button></li>
                        <li><hr className="dropdown-divider opacity-10" /></li>
                        <li>
                            <button className="dropdown-item py-2" onClick={onRefresh} disabled={isRefreshing || !anyItems}>
                                <div className="d-flex align-items-center">
                                    {isRefreshing && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>}
                                    {isRefreshing ? refreshStatus : "Refresh Vault"}
                                </div>
                            </button>
                        </li>
                        <li><button className="dropdown-item text-danger py-2" onClick={onClear} disabled={!anyItems}>Clear Vault</button></li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default MediaFilters;
