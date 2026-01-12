import Navbar from "./Navbar";
import { useLocation } from 'react-router-dom';
import React, { useState, useEffect } from "react";
import { auth, db } from "../utils/firebase"
import { ref, push, get } from "firebase/database";
import Footer from "./Footer";
import axios from "axios";
import MovieCardGrid from "../components/MovieCardGrid";


const RecommendedMovies = () => {
    const [searchResults, setSearchResults] = useState([]);
    const [addedMovies, setAddedMovies] = useState({});
    const [uid, setUid] = useState(null);
    const location = useLocation();
    const [customVaults, setCustomVaults] = useState([]);
    const [genres, setGenres] = useState([]);
    const [movieRatings, setMovieRatings] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

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

                    // Get movies from default vault
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

                    // Fetch custom vaults of type "movies" and their items
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
                            setCustomVaults(movieLists);
                        }
                    } catch (error) {
                        console.error('Error fetching custom vaults:', error);
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
        if (!location.state?.movieid && !location.state?.id) return;
        setIsLoading(true);
        setSearchResults([]);
        setCurrentPage(1);
        try {
            const response = await axios.get(`https://api.themoviedb.org/3/movie/${location.state.movieid || location.state.id}/recommendations`, {
                params: {
                    api_key: process.env.REACT_APP_API_KEY,
                    page: 1
                }
            });
            setSearchResults(response.data.results);
            setTotalPages(response.data.total_pages);
        } catch (error) {
            console.error('Error fetching movies:', error);
        }
        setIsLoading(false);
    };

    const loadMoreMovies = async () => {
        if (currentPage >= totalPages) return;
        setIsFetchingMore(true);
        const nextPage = currentPage + 1;
        try {
            const response = await axios.get(`https://api.themoviedb.org/3/movie/${location.state.movieid || location.state.id}/recommendations`, {
                params: {
                    api_key: process.env.REACT_APP_API_KEY,
                    page: nextPage
                }
            });
            setSearchResults(prev => [...prev, ...response.data.results]);
            setCurrentPage(nextPage);
        } catch (error) {
            console.error('Error fetching more movies:', error);
        }
        setIsFetchingMore(false);
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

    return (
        <div className="fade-in">
            <Navbar />
            <div className="search-hero">
                <div className="container">
                    <h1 className={`search-title-premium ${isLoading ? 'opacity-0' : 'animate-fade-in'}`}>
                        More Like {location.state.name}
                    </h1>
                    <p className={`text-muted fs-5 ${isLoading ? 'opacity-0' : 'animate-slide-up'}`}>
                        Discover movies with a similar cinematic spirit.
                    </p>
                </div>
            </div>

            {!isLoading && (
                <div className="container pb-5">
                    <MovieCardGrid
                        key="results"
                        movies={searchResults}
                        genres={genres}
                        movieRatings={movieRatings}
                        addedMovies={addedMovies}
                        customWatchlists={customVaults}
                        handleAddMovie={handleAddMovie}
                        defaultWatchlistName="Movies (Default)"
                        loading={isLoading}
                    />

                    {searchResults.length > 0 && currentPage < totalPages && (
                        <div className="text-center my-5 animate-fade-in">
                            <button
                                className="btn btn-premium btn-premium-outline px-5"
                                onClick={loadMoreMovies}
                                disabled={isFetchingMore}
                            >
                                {isFetchingMore ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Loading...
                                    </>
                                ) : (
                                    "Load More Recommendations"
                                )}
                            </button>
                        </div>
                    )}
                    <Footer />
                </div>
            )}
        </div>
    );
};

export default RecommendedMovies;