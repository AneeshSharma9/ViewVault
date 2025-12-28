import { useState } from "react";

const MovieCardGrid = ({ movies, genres, movieRatings, addedMovies, customWatchlists, handleAddMovie }) => {
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
            <div className="row mt-4">
                {movies.map((movie) => (
                    <div key={movie.id} className="col-12 col-md-6 col-lg-4 mb-3">
                        <div className="card h-100 shadow-sm">
                            {movie.poster_path && (
                                <img 
                                    src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`} 
                                    className="card-img-top" 
                                    alt={movie.title}
                                    style={{ objectFit: 'cover', height: '300px' }}
                                />
                            )}
                            <div className="card-body d-flex flex-column">
                                <div className="flex-grow-1">
                                    <h5 className="card-title">
                                        {movie.title}
                                        <span className={`ms-2 badge rounded-pill ${getBackgroundColor(movie.vote_average)}`}>
                                            {(movie.vote_average * 10).toFixed(0)}%
                                        </span>
                                    </h5>
                                    <p className="card-text text-muted small mb-1">
                                        {movie.release_date ? movie.release_date.substring(0, 4) : 'N/A'}
                                        {movieRatings && movieRatings[movie.id] && (
                                            <span className="badge bg-secondary ms-2">{movieRatings[movie.id]}</span>
                                        )}
                                    </p>
                                    <p className="card-text small text-secondary mb-2">
                                        {movie.genre_ids?.map(id => genres?.find(g => g.id === id)?.name).filter(Boolean).join(' / ') || 'N/A'}
                                    </p>
                                    <div>
                                        <p className="card-text small" style={{ 
                                            overflow: 'hidden', 
                                            display: '-webkit-box', 
                                            WebkitLineClamp: 3, 
                                            WebkitBoxOrient: 'vertical' 
                                        }}>
                                            {movie.overview || 'No description available.'}
                                        </p>
                                        {movie.overview && movie.overview.length > 150 && (
                                            <button 
                                                className="btn btn-link btn-sm p-0 text-primary"
                                                onClick={() => setSelectedMovieDescription(movie)}
                                                style={{ fontSize: '0.875rem', textDecoration: 'none' }}
                                            >
                                                See more
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-auto pt-2">
                                    {addedMovies && addedMovies[movie.id] ? (
                                        <button className="btn btn-success btn-sm w-100" type="button" disabled>✓ Added</button>
                                    ) : (
                                        <div className="dropdown">
                                            <button className="btn btn-primary btn-sm w-100 dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                + Add to Watchlist
                                            </button>
                                            <ul className="dropdown-menu dropdown-menu-end">
                                                <li><button className="dropdown-item" onClick={() => handleAddMovie(movie)}>Movies (Default)</button></li>
                                                {customWatchlists && customWatchlists.length > 0 && <li><hr className="dropdown-divider" /></li>}
                                                {customWatchlists && customWatchlists.map(list => (
                                                    <li key={list.id}>
                                                        <button className="dropdown-item" onClick={() => handleAddMovie(movie, list.id)}>
                                                            {list.name}
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
                                <h5 className="modal-title">{selectedMovieDescription.title}</h5>
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

