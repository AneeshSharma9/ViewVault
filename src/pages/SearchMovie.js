import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import { auth, db } from "../utils/firebase"
import { ref, push, get } from "firebase/database";
import Footer from "./Footer";
import MovieCardGrid from "../components/MovieCardGrid";


const SearchMovie = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [addedMovies, setAddedMovies] = useState({});
    const [uid, setUid] = useState(null);
    const inputRef = useRef(null);
    const [customWatchlists, setCustomWatchlists] = useState([]);
    const [genres, setGenres] = useState([]);
    const [movieRatings, setMovieRatings] = useState({});

    useEffect(() => {
        // Get user's already added movies from all watchlists
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
        try {
            const response = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
                params: {
                    api_key: `${process.env.REACT_APP_API_KEY}`,
                    query: searchQuery
                }
            });
            const results = response.data.results;
            setSearchResults(results);
        } catch (error) {
            console.error('Error fetching movies:', error);
        }
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
            <Navbar></Navbar>
            <div className="container">
                <h1 className="text-center p-5 fw-bold">Search for Movies</h1>
                <div className="input-group p-3 bg-white">
                    <input type="text" className="form-control" placeholder="Search for a movie..." ref={inputRef} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleKeyDown} onFocus={handleInputFocus} />
                    <div className="input-group-append">
                        <button className="btn btn-primary" type="button" onClick={handleSearch}>Search</button>
                    </div>
                </div>

                <MovieCardGrid 
                    movies={searchResults}
                    genres={genres}
                    movieRatings={movieRatings}
                    addedMovies={addedMovies}
                    customWatchlists={customWatchlists}
                    handleAddMovie={handleAddMovie}
                />
            </div>
            <Footer></Footer>
        </div>
    );
};

export default SearchMovie;
