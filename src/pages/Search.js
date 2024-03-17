import React, { useState } from "react";
import axios from "axios";

const Search = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);

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
            console.log(results)
        } catch (error) {
            console.error('Error fetching movies:', error);
        }
    };

    const handleSearch = () => {
        searchMovie();
    };

    return (
        <>
            <h1>ViewVault</h1>

            <nav className="nav nav-pills nav-fill">
                <a className="nav-item nav-link" href="/movies">Movies</a>
                <a className="nav-item nav-link" href="/tvshows">TV Shows</a>
                <a className="nav-item nav-link active" href="/anime">Anime</a>
                <a className="nav-item nav-link" href="/manga">Manga</a>
            </nav>

            <div className="container mt-4">
                <div className="input-group">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search for a movie..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="input-group-append">
                        <button className="btn btn-primary" type="button" onClick={handleSearch}>Search</button>
                    </div>
                </div>

                <ul className="list-group mt-4">
                    {searchResults.map((movie) => (
                        <li key={movie.id} className="list-group-item fw-bold">{movie.title}
                            <p className="fw-normal">{movie.overview}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );
};

export default Search;