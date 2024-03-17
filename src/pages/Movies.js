import { Link } from "react-router-dom";
import { useState } from "react";
import axios from 'axios';

const Movies = () => {

    const [movies, setMovies] = useState([
        { id: 1, name: "Movie 1" },
        { id: 2, name: "Movie 2" },
        { id: 3, name: "Movie 3" },
    ]);

    return (
        <>
            <h1>ViewVault</h1>

            <nav class="nav nav-pills nav-fill">
                <a class="nav-item nav-link active" href="/movies">Movies</a>
                <a class="nav-item nav-link" href="/tvshows">TV Shows</a>
                <a class="nav-item nav-link" href="/anime">Anime</a>
                <a class="nav-item nav-link" href="/manga">Manga</a>
            </nav>

            <h2>Movies</h2>

            <div className="container p-4">
                <div className="list-group list-group-light">
                    {movies.map((movie) => (
                        <li key={movie.id} className="list-group-item">
                            <input className="form-check-input" type="checkbox" value="" id={`checkboxExample${movie.id}`} />
                            <label className="form-check-label" htmlFor={`checkboxExample${movie.id}`}>{movie.name}</label>
                        </li>
                    ))}
                </div>
                <a className="btn btn-primary" href="./search">Add Movie</a>
            </div>
        </>
    )
};

export default Movies;