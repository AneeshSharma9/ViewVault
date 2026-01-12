import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { auth, db } from "../utils/firebase"
import { ref, push, get } from "firebase/database";
import Footer from "./Footer";
import MovieCardGrid from "../components/MovieCardGrid";


const SearchMovie = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [addedMovies, setAddedMovies] = useState({});
    const inputRef = useRef(null);
    const [customVaults, setCustomVaults] = useState([]);
    const [genres, setGenres] = useState([]);
    const [movieRatings, setMovieRatings] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    useEffect(() => {
        // Get user's already added movies from all vaults
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const uid = user.uid;
                if (uid) {
                    const addedMoviesData = {};

                    try {
                        const path = `users/${uid}/defaultwatchlists/movies/items`;
                        const snap = await get(ref(db, path));
                        if (snap.exists()) {
                            Object.values(snap.val()).forEach(m => { if (m.movieid) addedMoviesData[m.movieid] = true; });
                        }
                    } catch (error) {
                        console.error('Error fetching default movies:', error);
                    }

                    // Fetch custom vaults
                    try {
                        const vaultsRef = ref(db, `users/${uid}/customwatchlists`);
                        const snapshot = await get(vaultsRef);
                        const movieLists = {};

                        if (snapshot.exists()) {
                            const data = snapshot.val();
                            for (const key of Object.keys(data)) {
                                if (data[key].type === 'movies') {
                                    movieLists[key] = { id: key, ...data[key] };
                                    if (data[key].items) {
                                        Object.values(data[key].items).forEach(m => { if (m.movieid) addedMoviesData[m.movieid] = true; });
                                    }
                                }
                            }
                        }

                        setCustomVaults(Object.values(movieLists));
                    } catch (error) {
                        console.error('Error fetching custom vaults:', error);
                    }

                    setAddedMovies(addedMoviesData);
                }
                // No uid to set
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

    // Fetch age ratings for search results
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
        if (!searchQuery.trim()) return;
        setIsLoading(true);
        setHasSearched(true);
        setSearchResults([]);
        setCurrentPage(1);
        try {
            const response = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
                params: {
                    api_key: `${process.env.REACT_APP_API_KEY}`,
                    query: searchQuery,
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
            const response = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
                params: {
                    api_key: `${process.env.REACT_APP_API_KEY}`,
                    query: searchQuery,
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

    const handleSearch = () => {
        searchMovie();
    };

    const handleAddMovie = async (movie, listId = null) => {
        //Getting general movie details
        const detailsResponse = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${process.env.REACT_APP_API_KEY}`);
        if (!detailsResponse.ok) {
            throw new Error('Failed to fetch movie details');
        }
        const movieDetails = await detailsResponse.json();
        console.log(movieDetails);
        const genreString = movieDetails.genres
            .map(genre => genre.name)
            .join(' • ');
        console.log(genreString);

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
        console.log("imdbId: " + imdbId);

        //Saving movie to user's database
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
                releaseyear: movieDetails.release_date?.substring(0, 4) || '',
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

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            searchMovie();
        }
    };

    const handleInputFocus = () => {
        inputRef.current.select();
    };

    return (
        <div className="">
            <div className="search-hero">
                <div className="container">
                    <h1 className="search-title-premium animate-fade-in">Find Your Next Movie</h1>
                    <div className="search-container-premium animate-slide-up">
                        <div className="search-wrapper-premium">
                            <input
                                type="text"
                                className="search-input-premium"
                                placeholder="Enter movie title..."
                                ref={inputRef}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onFocus={handleInputFocus}
                            />
                            <button
                                className="search-btn-premium-inner"
                                type="button"
                                onClick={handleSearch}
                            >
                                Search
                            </button>
                        </div>
                        <p className="search-hint">Millions of movies to discover. Explore now.</p>
                    </div>
                </div>
            </div>

            <div className="container">
                {!isLoading && searchResults.length === 0 && hasSearched && (
                    <div className="text-center my-5 py-5 animate-fade-in">
                        <div className="display-1 mb-4" role="img" aria-label="Search">🔍</div>
                        <h3 className="fw-bold">No results found for "{searchQuery}"</h3>
                        <p className="text-muted">Try a different title or check for typos.</p>
                    </div>
                )}

                {!isLoading && searchResults.length === 0 && !hasSearched && (
                    <div className="text-center my-5 py-5 animate-fade-in opacity-75">
                        <div className="display-1 mb-4" role="img" aria-label="Movie">🎬</div>
                        <h3 className="fw-bold fs-2">Your Movie Vault Awaits</h3>
                        <p className="text-muted fs-5">Search millions of movies and keep track of what you want to watch.</p>
                    </div>
                )}

                <MovieCardGrid
                    key={isLoading ? "loading" : "results"}
                    movies={searchResults}
                    genres={genres}
                    movieRatings={movieRatings}
                    addedMovies={addedMovies}
                    customVaults={customVaults}
                    handleAddMovie={handleAddMovie}
                    defaultVaultName="Movies (Default)"
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
                                "Load More Results"
                            )}
                        </button>
                    </div>
                )}
            </div>
            <Footer></Footer>
        </div>
    );
};

export default SearchMovie;
