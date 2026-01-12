import { useState } from "react";

const MovieCardGrid = ({ movies, genres, movieRatings, addedMovies, customWatchlists, handleAddMovie, defaultWatchlistName, loading }) => {
    const [selectedMovieDescription, setSelectedMovieDescription] = useState(null);

    const getBackgroundColor = (voteAverage) => {
        if (voteAverage * 10 >= 70) return "bg-success";
        if (voteAverage * 10 >= 50) return "bg-warning text-dark";
        return "bg-danger";
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
                                <div className={`grid-rating-badge shadow-sm ${getBackgroundColor(movie.vote_average)} ${movie.vote_average * 10 < 70 && movie.vote_average * 10 >= 50 ? 'text-dark' : 'text-white'}`}>
                                    ⭐ {(movie.vote_average * 10).toFixed(0)}%
                                </div>
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
                                </div>

                                <div className="flex-grow-1">
                                    <p className="text-muted small line-clamp-3 mb-2" style={{ lineHeight: '1.6' }}>
                                        {movie.overview || 'No description available for this title.'}
                                    </p>
                                    {movie.overview && movie.overview.length > 100 && (
                                        <button
                                            className="btn btn-link btn-sm p-0 text-primary fw-bold"
                                            onClick={() => setSelectedMovieDescription(movie)}
                                            style={{ fontSize: '0.8rem', textDecoration: 'none' }}
                                        >
                                            Read more →
                                        </button>
                                    )}
                                </div>

                                <div className="mt-4 pt-3 border-top border-light">
                                    {addedMovies && addedMovies[movie.id] ? (
                                        <button className="btn btn-premium btn-premium-outline w-100 py-2" type="button" disabled style={{ opacity: 0.7 }}>
                                            ✓ In Watchlist
                                        </button>
                                    ) : (
                                        <div className="dropdown">
                                            <button className="btn btn-premium btn-premium-primary w-100 py-2 dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                + Add to Vault
                                            </button>
                                            <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-4 p-2 w-100">
                                                <li><button className="dropdown-item rounded-3 py-2" onClick={() => handleAddMovie(movie)}>🎬 {defaultWatchlistName || "Main List"}</button></li>
                                                {customWatchlists && customWatchlists.length > 0 && <li><hr className="dropdown-divider opacity-10" /></li>}
                                                {customWatchlists && customWatchlists.map(list => (
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
            {selectedMovieDescription && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{selectedMovieDescription.title || selectedMovieDescription.name}</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setSelectedMovieDescription(null)}
                                    aria-label="Close"
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p>{selectedMovieDescription.overview || 'No description available.'}</p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setSelectedMovieDescription(null)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MovieCardGrid;

