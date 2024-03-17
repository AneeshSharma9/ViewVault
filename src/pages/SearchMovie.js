import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import { auth, db } from "../utils/firebase"
import { ref, push } from "firebase/database";

const SearchMovie = () => {
    const database = db;

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [addedMovies, setAddedMovies] = useState({});

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

    const handleAddMovie = (movie) => {
        const uid = auth.currentUser.uid;
        if (uid) {
            const userMovieListRef = ref(db, `users/${uid}/movielist`);
            push(userMovieListRef, {
                movietitle: movie.title
            })
                .then(() => {
                    console.log('Movie added successfully!');
                    setAddedMovies({...addedMovies, [movie.id]: true});
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

    return (
        <div className="">
            <Navbar></Navbar>


            <div className="container">
                <h1 className="text-center p-4">Find Movies</h1>
                <div className="input-group">
                    <input type="text" className="form-control" placeholder="Search for a movie..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleKeyDown}/>
                    <div className="input-group-append">
                        <button className="btn btn-primary" type="button" onClick={handleSearch}>Search</button>
                    </div>
                </div>

                <ul className="list-group mt-4">
                    {searchResults.map((movie) => (
                        <li key={movie.id} className="list-group-item rounded mb-2 shadow p-3 bg-white d-flex justify-content-between align-items-center">
                            <div className="">
                                <p className="fw-bold">{movie.title} <span className="fw-light">({movie.release_date.substring(0, 4)})</span></p>
                                <p className="fw-normal">{movie.overview}</p>
                            </div>
                            <button className={`btn ${addedMovies[movie.id] ? 'btn-success' : 'btn-primary'}`} type="button" onClick={() => { handleAddMovie(movie) }}>{addedMovies[movie.id] ? '✓' : '+'}</button>                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default SearchMovie;