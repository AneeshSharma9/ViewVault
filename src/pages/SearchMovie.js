import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import { auth, db } from "../utils/firebase"
import { ref, push, get } from "firebase/database";
import Footer from "./Footer";


const SearchMovie = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [addedMovies, setAddedMovies] = useState({});
    const [uid, setUid] = useState(null);
    const inputRef = useRef(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                const uid = user.uid;
                setUid(uid);
                if (uid) {
                    const userMovieListRef = ref(db, `users/${uid}/movielist`);
                    get(userMovieListRef).then((snapshot) => {
                        if (snapshot.exists()) {
                            const movieData = snapshot.val();
                            const movieIds = Object.values(movieData).map((movie) => movie.movieid);
                            const addedMoviesData = {};
                            movieIds.forEach((movieId) => {
                                addedMoviesData[movieId] = true;
                            });
                            setAddedMovies(addedMoviesData);
                        }
                    }).catch((error) => {
                        console.error('Error fetching user movies:', error);
                    });
                }
            } else {
                setUid(null);
            }
        });
        return () => unsubscribe();
    }, []);

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

    const handleAddMovie = async (movie) => {
        //Getting general movie details
        const detailsResponse = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${process.env.REACT_APP_API_KEY}`);
        if (!detailsResponse.ok) {
            throw new Error('Failed to fetch movie details');
        }
        const movieDetails = await detailsResponse.json();
        console.log(movieDetails);
        const genreString = movieDetails.genres
          .map(genre => genre.name)
          .join(' / ');
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
            const userMovieListRef = ref(db, `users/${uid}/movielist`);
            push(userMovieListRef, {
                movietitle: movie.title,
                movieid: movie.id,
                watched: false,
                runtime: movieDetails.runtime,
                providers: providerNames,
                agerating: certificationForUS,
                voteaverage: movie.vote_average,
                genres: genreString,
                releaseyear: movieDetails.release_date.substring(0, 4),
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

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            searchMovie();
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

    const handleInputFocus = () => {
        inputRef.current.select();
    };

    return (
        <div className="">
            <Navbar></Navbar>
            <div className="container">
                <h1 className="text-center p-5 fw-bold">Find Movies</h1>
                <div className="input-group p-3 bg-white">
                    <input type="text" className="form-control" placeholder="Search for a movie..." ref={inputRef} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleKeyDown} onFocus={handleInputFocus} />
                    <div className="input-group-append">
                        <button className="btn btn-primary" type="button" onClick={handleSearch}>Search</button>
                    </div>
                </div>

                <ul className="list-group mt-4">
                    {searchResults.map((movie) => (
                        <li key={movie.id} className="list-group-item rounded mb-2 shadow p-3 bg-white d-flex justify-content-between align-items-center">
                            <div className="">
                                <p className="fw-bold">{movie.title}
                                    <span className="m-1 fw-light">({movie.release_date.substring(0, 4)})</span>
                                    <span className={`m-1 badge rounded-pill ${getBackgroundColor(movie.vote_average)}`}>{(movie.vote_average * 10).toFixed(2)}%</span>
                                </p>
                                <p className="fw-normal">{movie.overview}</p>
                            </div>
                            {addedMovies[movie.id] ? (
                                <button className="btn btn-success mx-3" type="button">✓</button>
                            ) : (
                                <button className="btn btn-primary mx-3" type="button" onClick={() => { handleAddMovie(movie) }}>+</button>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
            <Footer></Footer>
        </div>
    );
};

export default SearchMovie;
