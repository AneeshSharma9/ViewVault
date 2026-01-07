import React from 'react';

const MediaCard = ({
    item,
    type, // 'movie' or 'tv'
    watchSites,
    selectedProviders,
    getProviderLogo,
    handleToggleWatched,
    handleDeleteClick,
    toComponentB,
    openWatchSite,
    toImdbParentsGuide,
}) => {
    const getTextColorClass = (voteAverage) => {
        if (voteAverage * 10 >= 70) return "text-success";
        if (voteAverage * 10 >= 50) return "text-warning";
        return "text-danger";
    };

    const getAgeRatingClass = (rating) => {
        if (!rating) return "bg-secondary";
        const r = rating.toUpperCase();
        if (["G", "TV-G", "TV-Y"].includes(r)) return "bg-success";
        if (["PG", "TV-PG", "TV-Y7"].includes(r)) return "bg-primary";
        if (["PG-13", "TV-14"].includes(r)) return "bg-warning text-dark";
        if (["R", "NC-17", "TV-MA"].includes(r)) return "bg-danger";
        return "bg-secondary";
    };

    const convertMinToHrMin = (minutes) => {
        if (isNaN(minutes) || minutes === null) return "N/A";
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        if (hours === 0) return `${remainingMinutes} mins`;
        if (remainingMinutes === 0) return `${hours} hr`;
        return `${hours} hr ${remainingMinutes} mins`;
    };

    const posterUrl = item.poster_path
        ? (item.poster_path.startsWith('http')
            ? item.poster_path
            : `https://image.tmdb.org/t/p/w185${item.poster_path.startsWith('/') ? item.poster_path : '/' + item.poster_path}`)
        : null;

    const year = type === 'movie'
        ? (item.releaseyear || "N/A")
        : (item.first_air_date ? item.first_air_date.substring(0, 4) : "N/A");

    const metaLabel = type === 'movie'
        ? `⏱ ${convertMinToHrMin(item.runtime)}`
        : `📺 ${item.num_episodes} Episodes`;

    return (
        <li className="media-card-premium fade-in">
            {/* Poster Column */}
            <div className="media-poster-wrapper">
                {posterUrl ? (
                    <div className="btn-group dropend w-100 h-100">
                        <button
                            type="button"
                            className="btn p-0 border-0 w-100 h-100 position-relative"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                            style={{ borderRadius: '12px', overflow: 'hidden' }}
                        >
                            <img
                                src={posterUrl}
                                alt={item.name}
                                className="media-poster"
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/100x150?text=No+Img'; }}
                            />
                            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center hover-overlay" style={{ background: 'rgba(0,0,0,0.4)', transition: 'opacity 0.2s', opacity: 0 }}>
                                <span className="text-white fw-bold small">Options</span>
                            </div>
                        </button>
                        <ul className="dropdown-menu shadow-lg border-0 rounded-4 p-2">
                            <li><button className="dropdown-item rounded-3" onClick={() => toComponentB(item)}>✨ More like this</button></li>
                            {watchSites.length > 0 && <li><hr className="dropdown-divider opacity-10" /></li>}
                            {watchSites.map((site, index) => (
                                <li key={index}>
                                    <button className="dropdown-item rounded-3" onClick={() => openWatchSite(item.name, site)}>
                                        🎬 Stream on {site.name}
                                    </button>
                                </li>
                            ))}
                            {type === 'movie' && toImdbParentsGuide && (
                                <>
                                    <li><hr className="dropdown-divider opacity-10" /></li>
                                    <li>
                                        <button className="dropdown-item rounded-3" onClick={() => toImdbParentsGuide(item.imdbid)}>
                                            🛡️ IMDB Parents Guide
                                        </button>
                                    </li>
                                </>
                            )}
                        </ul>
                    </div>
                ) : (
                    <div className="bg-light rounded d-flex align-items-center justify-content-center text-muted h-100">
                        <span className="small">No Poster</span>
                    </div>
                )}
            </div>

            {/* Content Column */}
            <div className="media-content">
                <div className="d-flex justify-content-between align-items-start">
                    <div>
                        <h5 className="media-title mb-1">{item.name}</h5>
                        <div className="d-flex align-items-center gap-2 mb-2">
                            <span className="badge bg-secondary bg-opacity-10 text-muted border-0 rounded-pill px-2 py-1" style={{ fontSize: '0.75rem' }}>{year}</span>
                            <span className={`badge ${getAgeRatingClass(item.agerating || "N/A")} rounded-pill px-2 py-1 border-0`} style={{ fontSize: '0.7rem' }}>
                                {item.agerating || "N/A"}
                            </span>
                        </div>
                    </div>
                    <div
                        className={`watched-toggle ${item.watched ? 'active' : ''}`}
                        onClick={() => handleToggleWatched(item, item.watched)}
                        title={item.watched ? "Mark as unwatched" : "Mark as watched"}
                    >
                        {item.watched ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l2.578 2.576L12.736 3.97z" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />
                                <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
                            </svg>
                        )}
                    </div>
                </div>

                <div className="d-flex flex-wrap align-items-center gap-3 mb-2" style={{ fontSize: '0.85rem' }}>
                    {item.watched && item.user_rating !== undefined && item.user_rating !== null && (
                        <span className="text-warning fw-bold">⭐ {item.user_rating}</span>
                    )}
                    {item.vote_average > 0 && (
                        <span className={`${getTextColorClass(item.vote_average)} fw-bold`}>
                            {(item.vote_average * 10).toFixed(1)}% Score
                        </span>
                    )}
                    <span className="text-muted opacity-75">{metaLabel}</span>
                </div>

                <div className="mb-2 line-clamp-2" style={{ fontSize: '0.85rem' }}>
                    <span className="text-muted">{item.genres || "No genres available"}</span>
                </div>

                {/* Providers */}
                <div className="d-flex justify-content-between align-items-end mt-2">
                    <div className="d-flex flex-wrap gap-1">
                        {item.providers && item.providers.length > 0 && (() => {
                            const filteredProviders = selectedProviders && selectedProviders.length > 0
                                ? item.providers.filter(p => selectedProviders.includes(p))
                                : item.providers;
                            return filteredProviders.slice(0, 4).map((provider, idx) => {
                                const logo = getProviderLogo(provider);
                                return logo ? (
                                    <img key={idx} src={logo} alt={provider} title={provider} className="rounded-circle shadow-sm" style={{ width: '22px', height: '22px', border: '1px solid rgba(0,0,0,0.05)' }} />
                                ) : (
                                    <span key={idx} className="badge bg-light text-dark p-1 rounded-pill" style={{ fontSize: '0.65rem' }}>{provider}</span>
                                );
                            });
                        })()}
                        {item.providers?.length > 4 && <span className="small text-muted align-self-center">+{item.providers.length - 4}</span>}
                    </div>

                    <button
                        className="remove-btn"
                        onClick={() => handleDeleteClick(item)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                            <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                        </svg>
                        Remove
                    </button>
                </div>
            </div>
        </li>
    );
};

export default MediaCard;
