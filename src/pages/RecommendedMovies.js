import Navbar from "./Navbar";
import { useLocation } from 'react-router-dom';
import React, { useState, useEffect } from "react";
import { auth, db } from "../utils/firebase"
import { ref, push, get } from "firebase/database";
import Footer from "./Footer";
import axios from "axios";


const RecommendedMovies = () => {
    const [searchResults, setSearchResults] = useState([]);
    const [addedMovies, setAddedMovies] = useState({});
    const [uid, setUid] = useState(null);
    const location = useLocation();
    const [customWatchlists, setCustomWatchlists] = useState([]);
    const [genres, setGenres] = useState([]);
    const [movieRatings, setMovieRatings] = useState({});
    const [selectedMovieDescription, setSelectedMovieDescription] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                const uid = user.uid;
                setUid(uid);
                if (uid) {
                    searchMovie();
                }
            } else {
                setUid(null);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const uid = user.uid;
                setUid(uid);
                if (uid) {
                    const addedMoviesData = {};

                    // Get movies from default watchlist
                    try {
                        const userMovieListRef = ref(db, `users/${uid}/defaultwatchlists/movies/items`);
                        const defaultSnapshot = await get(userMovieListRef);
                        if (defaultSnapshot.exists()) {
                            const movieData = defaultSnapshot.val();
                            Object.values(movieData).forEach((movie) => {
                                if (movie.movieid) {
                                    addedMoviesData[movie.movieid] = true;
                                }
                            });
                        }
                    } catch (error) {
                        console.error('Error fetching default movies:', error);
                    }

                    // Fetch custom watchlists of type "movies" and their items
                    try {
                        const watchlistsRef = ref(db, `users/${uid}/customwatchlists`);
                        const watchlistsSnapshot = await get(watchlistsRef);
                        if (watchlistsSnapshot.exists()) {
                            const data = watchlistsSnapshot.val();
                            const movieLists = [];
                            
                            for (const key of Object.keys(data)) {
                                if (data[key].type === 'movies') {
                                    movieLists.push({
                                        id: key,
                                        ...data[key]
                                    });
                                    
                                    // Check items in this custom list
                                    if (data[key].items) {
                                        Object.values(data[key].items).forEach((movie) => {
                                            if (movie.movieid) {
                                                addedMoviesData[movie.movieid] = true;
                                            }
                                        });
                                    }
                                }
                            }
                            setCustomWatchlists(movieLists);
                        }
                    } catch (error) {
                        console.error('Error fetching custom watchlists:', error);
                    }

                    setAddedMovies(addedMoviesData);
                }
            } else {
                setUid(null);
            }
        });
        return () => unsubscribe();
    }, []);

    // Fetch genres
    useEffect(() => {
        const fetchGenres = async () => {
            try {
                const response = await axios.get(`https://api.themoviedb.org/3/genre/movie/list?language=en`, {
                    params: {
                        api_key: process.env.REACT_APP_API_KEY,
                    }
                });
                setGenres(response.data.genres);
            } catch (error) {
                console.error('Error fetching genres:', error);
            }
        };
        fetchGenres();
    }, []);

    // Fetch age ratings for recommended movies
    useEffect(() => {
        const fetchRatings = async () => {
            const moviesToFetch = searchResults.filter(m => !movieRatings[m.id]);
            if (moviesToFetch.length === 0) return;

            const newRatings = { ...movieRatings };
            
            // Fetch ratings in parallel (batch of 5 at a time to avoid rate limiting)
            for (let i = 0; i < moviesToFetch.length; i += 5) {
                const batch = moviesToFetch.slice(i, i + 5);
                const promises = batch.map(async (movie) => {
                    try {
                        const response = await axios.get(
                            `https://api.themoviedb.org/3/movie/${movie.id}/release_dates`,
                            { params: { api_key: process.env.REACT_APP_API_KEY } }
                        );
                        const usRelease = response.data.results.find(r => r.iso_3166_1 === 'US');
                        if (usRelease) {
                            const certification = usRelease.release_dates.find(rd => rd.certification)?.certification;
                            return { id: movie.id, rating: certification || 'NR' };
                        }
                        return { id: movie.id, rating: 'NR' };
                    } catch {
                        return { id: movie.id, rating: 'NR' };
                    }
                });
                
                const results = await Promise.all(promises);
                results.forEach(r => { newRatings[r.id] = r.rating; });
            }
            
            setMovieRatings(newRatings);
        };
        
        if (searchResults.length > 0) {
            fetchRatings();
        }
    }, [searchResults]); // eslint-disable-line react-hooks/exhaustive-deps

    const searchMovie = async () => {
        try {
            const detailsResponse = await fetch(`https://api.themoviedb.org/3/movie/${location.state.movieid}/recommendations?api_key=${process.env.REACT_APP_API_KEY}`);
            if (!detailsResponse.ok) {
                throw new Error('Failed to fetch movie details');
            }
            const movieDetails = await detailsResponse.json();
            console.log(movieDetails)
            setSearchResults(movieDetails.results);
        } catch (error) {
            console.error('Error fetching movies:', error);
        }
    };


    const handleAddMovie = async (movie, listId = null) => {
        //Getting general movie details
        const detailsResponse = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${process.env.REACT_APP_API_KEY}`);
        if (!detailsResponse.ok) {
            throw new Error('Failed to fetch movie details');
        }
        const movieDetails = await detailsResponse.json();
        const genreString = movieDetails.genres.map(genre => genre.name).join(' / ');

        //Getting age rating
        const ratingResponse = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/release_dates?api_key=${process.env.REACT_APP_API_KEY}`);
        if (!ratingResponse.ok) {
            throw new Error('Failed to fetch movie details');
        }
        const movieRating = await ratingResponse.json();
        let certificationForUS = null;
        const results = movieRating.results;
        for (const result of results) {
            if (result.iso_3166_1 === "US") {
                const releaseDates = result.release_dates;
                for (const releaseDate of releaseDates) {
                    if (releaseDate.certification) {
                        certificationForUS = releaseDate.certification;
                        break;
                    }
                }
                break;
            }
        }

        //Getting streaming providers
        const providersResponse = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/watch/providers?api_key=${process.env.REACT_APP_API_KEY}`);
        if (!providersResponse.ok) {
            throw new Error('Failed to fetch movie details');
        }
        const movieProviders = await providersResponse.json();
        let providerNames = [];
        if (movieProviders.results.US && movieProviders.results.US.flatrate) {
            const flatrateProviders = movieProviders.results.US.flatrate;
            providerNames = flatrateProviders.map(provider => provider.provider_name);
        }

        //Getting imdb id from tmdb id
        const imdbResponse = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/external_ids?api_key=${process.env.REACT_APP_API_KEY}`);
        if (!imdbResponse.ok) {
            throw new Error('Failed to fetch movie details');
        }
        const imdbData = await imdbResponse.json();
        const imdbId = imdbData.imdb_id;

        const uid = auth.currentUser.uid;
        if (uid) {
            // Determine the path based on whether it's a custom list or default
            const listPath = listId 
                ? `users/${uid}/customwatchlists/${listId}/items`
                : `users/${uid}/defaultwatchlists/movies/items`;
            const userMovieListRef = ref(db, listPath);
            push(userMovieListRef, {
                movietitle: movie.title,
                movieid: movie.id,
                watched: false,
                runtime: movieDetails.runtime,
                providers: providerNames,
                agerating: certificationForUS,
                voteaverage: movie.vote_average,
                genres: genreString,
                releaseyear: movieDetails.release_date ? movieDetails.release_date.substring(0, 4) : "",
                imdbid: imdbId,
                poster_path: movie.poster_path || ''
            })
                .then(() => {
                    console.log('Movie added successfully!');
                    setAddedMovies({ ...addedMovies, [movie.id]: true });
                })
                .catch((error) => {
                    console.error('Error adding movie:', error);
                });
        } else {
            console.error('User is not signed in!');
        }
    };

    const getBackgroundColor = (voteAverage) => {
        if (voteAverage * 10 >= 70) {
            return "bg-success";
        } else if (voteAverage * 10 >= 50) {
            return "bg-warning text-dark";
        } else {
            return "bg-danger";
        }
    };

    return (
        <div className="">
            <Navbar></Navbar>
            <div className="container">
                <h1 className="text-center m-5">Movies like {location.state.name}</h1>
                {searchResults.length > 0 && (
                    <div className="row mt-4">
                        {searchResults.map((movie) => (
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
                                                {movieRatings[movie.id] && (
                                                    <span className="badge bg-secondary ms-2">{movieRatings[movie.id]}</span>
                                                )}
                                            </p>
                                            <p className="card-text small text-secondary mb-2">
                                                {movie.genre_ids?.map(id => genres.find(g => g.id === id)?.name).filter(Boolean).join(' / ') || 'N/A'}
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
                                            {addedMovies[movie.id] ? (
                                                <button className="btn btn-success btn-sm w-100" type="button" disabled>✓ Added</button>
                                            ) : (
                                                <div className="dropdown">
                                                    <button className="btn btn-primary btn-sm w-100 dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                        + Add to Watchlist
                                                    </button>
                                                    <ul className="dropdown-menu dropdown-menu-end">
                                                        <li><button className="dropdown-item" onClick={() => handleAddMovie(movie)}>Movies (Default)</button></li>
                                                        {customWatchlists.length > 0 && <li><hr className="dropdown-divider" /></li>}
                                                        {customWatchlists.map(list => (
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
                )}
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

            <Footer></Footer>
        </div>
    )
};

export default RecommendedMovies;