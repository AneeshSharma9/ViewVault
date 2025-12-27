import Navbar from "./Navbar";
import { useLocation } from 'react-router-dom';
import React, { useState, useEffect } from "react";
import { auth, db } from "../utils/firebase"
import { ref, push, get } from "firebase/database";
import Footer from "./Footer";


const RecommendedMovies = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [addedMovies, setAddedMovies] = useState({});
    const [uid, setUid] = useState(null);
    const location = useLocation();
    const [customWatchlists, setCustomWatchlists] = useState([]);

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
                imdbid: imdbId
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
                <ul className="list-group mt-4">
                    {searchResults.map((movie) => (
                        <li key={movie.id} className="list-group-item rounded mb-2 shadow p-3 bg-white d-flex justify-content-between align-items-center">
                            <div className="">
                                <p className="fw-bold">{movie.title} <span className="fw-light">({movie.release_date.substring(0, 4)})</span> <span className={`badge rounded-pill ${getBackgroundColor(movie.vote_average)}`}>{(movie.vote_average * 10).toFixed(2)}%</span></p>
                                <p className="fw-normal">{movie.overview}</p>
                            </div>
                            {addedMovies[movie.id] ? (
                                <button className="btn btn-success me-2 flex-shrink-0" type="button">✓</button>
                            ) : (
                                <div className="dropdown flex-shrink-0">
                                    <button className="btn btn-primary me-2 dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                        +
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
                        </li>
                    ))}
                </ul>
            </div>
            <Footer></Footer>
        </div>
    )
};

export default RecommendedMovies;