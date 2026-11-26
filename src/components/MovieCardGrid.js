import { useState } from "react";
import { createPortal } from "react-dom";
import { toScorePercent, consensusScore10 } from "../utils/ratings";

const MovieCardGrid = ({ movies, genres, movieRatings, addedMovies, customVaults, handleAddMovie, defaultVaultName, loading, ratings = {}, handleMoveTo }) => {
    const [selectedMovieDescription, setSelectedMovieDescription] = useState(null);

    // The poster badge score: cross-source consensus (TMDB + IMDb + RT) when
    // available, falling back to the raw TMDB score.
    const getPosterBadge = (movie) => {
        const scoreInfo = ratings?.[movie.id];
        const consensusScore = consensusScore10(scoreInfo);
        const score = consensusScore ?? movie.vote_average ?? null;
        const percent = score != null ? score * 10 : null;
        const bg = percent == null ? "bg-danger" : percent >= 70 ? "bg-success" : percent >= 50 ? "bg-warning text-dark" : "bg-danger";
        const textDark = percent != null && percent < 70 && percent >= 50;
        return (
            <div className={`grid-rating-badge shadow-sm ${bg} ${textDark ? 'text-dark' : 'text-white'}`}>
                ⭐ {(percent ?? 0).toFixed(0)}%
            </div>
        );
    };



    if (!movies || movies.length === 0) {
        return null;
    }

    return (
        <>
            <div className="row g-4 mt-2">
                {movies.map((movie, index) => (
                    <div
                        key={movie.id}
                        className="col-12 col-md-6 col-lg-4 animate-slide-up"
                        style={{ animationDelay: `${index * 0.08}s` }}
                    >
                        <div className="grid-card-premium shadow-sm">
                            <div className="grid-poster-area">
                                {movie.poster_path ? (
                                    <img
                                        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                                        className="grid-poster"
                                        alt={movie.title || movie.name}
                                    />
                                ) : (
                                    <div className="bg-secondary d-flex align-items-center justify-content-center text-white h-100">No Image</div>
                                )}
                                {getPosterBadge(movie)}
                                <div className="grid-overlay">
                                    <span className="text-white small fw-bold mb-1">RELEASED</span>
                                    <span className="text-white h5 mb-0">{(movie.release_date || movie.first_air_date) ? (movie.release_date || movie.first_air_date).substring(0, 4) : 'N/A'}</span>
                                </div>
                            </div>

                            <div className="grid-body">
                                <h5 className="grid-card-title line-clamp-1 mb-1">{movie.title || movie.name}</h5>

                                <div className="d-flex align-items-center gap-2 mb-3">
                                    <span className="text-muted small">
                                        {movie.genre_ids?.slice(0, 2).map(id => genres?.find(g => g.id === id)?.name).filter(Boolean).join(' • ') || 'Genre N/A'}
                                    </span>
                                    {movieRatings && movieRatings[movie.id] && (
                                        <span className="badge bg-secondary bg-opacity-10 text-muted border-0 rounded-pill px-2 py-1" style={{ fontSize: '0.7rem' }}>{movieRatings[movie.id]}</span>
                                    )}
                                    {addedMovies && addedMovies[movie.id] && (
                                        <span className={`badge rounded-pill px-2 py-1 ${addedMovies[movie.id].watched ? 'bg-danger bg-opacity-10 text-danger' : 'bg-secondary bg-opacity-10 text-muted border-0'}`} style={{ fontSize: '0.7rem' }} title={addedMovies[movie.id].watched ? `Watched${addedMovies[movie.id].vaultName ? ` · In ${addedMovies[movie.id].vaultName}` : ''}` : `In ${addedMovies[movie.id].vaultName || defaultVaultName || 'Vault'}`}>
                                            {addedMovies[movie.id].watched
                                                ? `✓ Watched${addedMovies[movie.id].vaultName ? ` · In ${addedMovies[movie.id].vaultName}` : ''}`
                                                : `📁 ${addedMovies[movie.id].vaultName || defaultVaultName || 'Vault'}`}
                                        </span>
                                    )}
                                </div>

                                {ratings?.[movie.id] && (
                                    <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                                        {ratings[movie.id].tmdb != null && ratings[movie.id].tmdb > 0 && (
                                            <span className={`badge rounded-pill ${toScorePercent(ratings[movie.id].tmdb).badgeClass}`} style={{ fontSize: '0.75rem' }} title="TMDB rating">
                                                ⭐ TMDB {(ratings[movie.id].tmdb * 10).toFixed(0)}%
                                            </span>
                                        )}
                                        {ratings[movie.id].imdb != null && (
                                            <span className={`badge rounded-pill ${toScorePercent(ratings[movie.id].imdb).badgeClass}`} style={{ fontSize: '0.75rem' }} title="IMDb rating">
                                                🎬 IMDb {ratings[movie.id].imdb}
                                            </span>
                                        )}
                                        {ratings[movie.id].rottentomatoes != null && (
                                            <span className={`badge rounded-pill ${toScorePercent(ratings[movie.id].rottentomatoes, true).badgeClass}`} style={{ fontSize: '0.75rem' }} title="Rotten Tomatoes critic score">
                                                🍅 RT {toScorePercent(ratings[movie.id].rottentomatoes, true).percent}%
                                            </span>
                                        )}
                                    </div>
                                )}

                                <div className="flex-grow-1">
                                    <p className="text-muted small line-clamp-3 mb-2" style={{ lineHeight: '1.6' }}>
                                        {movie.overview || 'No description available for this title.'}
                                    </p>
                                    {movie.overview && movie.overview.length > 100 && (
                                        <button
                                            className="btn btn-link btn-sm p-0 fw-bold"
                                            onClick={() => setSelectedMovieDescription(movie)}
                                            style={{ fontSize: '0.8rem', textDecoration: 'none', color: 'var(--secondary)' }}
                                        >
                                            Read more →
                                        </button>
                                    )}
                                </div>

                                <div className="mt-4 pt-3 border-top border-light flex-shrink-0">
                                    {addedMovies && addedMovies[movie.id] && addedMovies[movie.id].watched ? (
                                        <button className="btn btn-premium btn-premium-outline w-100 py-2" type="button" disabled
                                            style={{ opacity: 0.7, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                            title={addedMovies[movie.id].watched ? "Watched" : `In ${addedMovies[movie.id].vaultName || defaultVaultName || 'Vault'}`}>
                                            ✓ {addedMovies[movie.id].watched ? `Watched${addedMovies[movie.id].vaultName ? ` · In ${addedMovies[movie.id].vaultName}` : ''}` : `In ${addedMovies[movie.id].vaultName || defaultVaultName || 'Vault'}`}
                                        </button>
                                    ) : addedMovies && addedMovies[movie.id] && !addedMovies[movie.id].watched ? (
                                        <div className="dropdown">
                                            <button className="btn btn-premium btn-premium-outline w-100 py-2" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                📁 Move to Vault
                                            </button>
                                            <ul className="dropdown-menu dropdown-menu-end shadow-lg rounded-4 p-2 w-100">
                                                {customVaults && customVaults.map(v => (
                                                    <li key={v.id}>
                                                        <button className="dropdown-item rounded-3 py-2" onClick={() => (handleMoveTo ? handleMoveTo(movie, v.id) : handleAddMovie(movie, v.id))}>
                                                            📁 {v.name}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ) : (
                                        <div className="dropdown">
                                            <button className="btn btn-premium btn-premium-primary w-100 py-2 dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                + Add to Vault
                                            </button>
                                            <ul className="dropdown-menu dropdown-menu-end shadow-lg rounded-4 p-2 w-100">
                                                <li><button className="dropdown-item rounded-3 py-2" onClick={() => handleAddMovie(movie)}>🎬 {defaultVaultName || "Main List"}</button></li>
                                                {customVaults && customVaults.length > 0 && <li><hr className="dropdown-divider opacity-10" /></li>}
                                                {customVaults && customVaults.map(list => (
                                                    <li key={list.id}>
                                                        <button className="dropdown-item rounded-3 py-2" onClick={() => handleAddMovie(movie, list.id)}>
                                                            📁 {list.name}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Movie Description Modal */}
            {selectedMovieDescription && createPortal(
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 10000 }} onClick={() => setSelectedMovieDescription(null)}>
                    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '1.5rem', overflow: 'hidden' }}>
                            <div className="modal-header border-0 pb-0 pt-4 px-4">
                                <h5 className="modal-title fw-bold mb-0" style={{ fontSize: '1.5rem' }}>{selectedMovieDescription.title || selectedMovieDescription.name}</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setSelectedMovieDescription(null)}
                                    aria-label="Close"
                                ></button>
                            </div>
                            <div className="modal-body py-4 px-4">
                                <p className="mb-0" style={{ fontSize: '1rem', lineHeight: '1.7', color: 'var(--text)' }}>
                                    {selectedMovieDescription.overview || 'No description available.'}
                                </p>
                            </div>
                            <div className="modal-footer border-0 pt-0 pb-4 px-4">
                                <button
                                    type="button"
                                    className="btn rounded-pill px-4"
                                    onClick={() => setSelectedMovieDescription(null)}
                                    style={{ 
                                        backgroundColor: 'var(--secondary)', 
                                        borderColor: 'var(--secondary)', 
                                        color: 'white',
                                        fontWeight: '600'
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default MovieCardGrid;

