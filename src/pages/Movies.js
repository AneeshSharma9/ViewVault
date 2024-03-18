import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import { auth, db } from "../utils/firebase"
import { ref, get, remove, update } from "firebase/database";

const Movies = () => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uid, setUid] = useState(null);
    const [sortBy, setSortBy] = useState("Sort By");

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                const uid = user.uid;
                setUid(uid);
                fetchMovies(uid);
            } else {
                setUid(null);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const fetchMovies = async (uid) => {
        try {
            const moviesRef = ref(db, `users/${uid}/movielist`);
            const snapshot = await get(moviesRef);
            if (snapshot.exists()) {
                const movieData = snapshot.val();
                const movieArray = Object.keys(movieData).map((key) => ({
                    id: key,
                    name: movieData[key].movietitle,
                    watched: movieData[key].watched
                }));

                setMovies(movieArray);
            } else {
                console.log("No movies available");
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching movies:', error);
        }
    };

    const handleRemoveMovie = (movieId) => {
        const movieRef = ref(db, `users/${uid}/movielist/${movieId}`);
        remove(movieRef)
            .then(() => {
                console.log('Movie removed successfully!');
                // Remove the movie from the state
                setMovies(movies.filter(movie => movie.id !== movieId));
            })
            .catch((error) => {
                console.error('Error removing movie:', error);
            });
    };

    const handleToggleWatched = async (movieId, watched) => {
        try {
            const movieRef = ref(db, `users/${uid}/movielist/${movieId}`);
            await update(movieRef, { watched: !watched });
            setMovies(movies.map(movie => {
                if (movie.id === movieId) {
                    return { ...movie, watched: !watched };
                }
                return movie;
            }));
        } catch (error) {
            console.error('Error updating watched status:', error);
        }
    };

    const handleSortBy = (value) => {
        setSortBy(value);
    
        // Sort the movies array based on the sortBy value
        if (value === "To Watch") {
            const sortedMovies = movies.slice().sort((a, b) => {
                return a.watched - b.watched;
            });
            setMovies(sortedMovies);
        } else if (value === "Watched") {
            const sortedMovies = movies.slice().sort((a, b) => {
                return b.watched - a.watched;
            });
            setMovies(sortedMovies);
        }
    };

    return (
        <div className="">
            <Navbar />
            <div className="container">
                <nav className="nav nav-pills nav-fill p-4">
                    <a className="nav-item nav-link active" href="/movies">Movies</a>
                    <a className="nav-item nav-link" href="/tvshows">TV Shows</a>
                    <a className="nav-item nav-link" href="/anime">Anime</a>
                    <a className="nav-item nav-link" href="/manga">Manga</a>
                </nav>

                <h1 className="text-center">Movie Watchlist</h1>

                <div className="pt-2 pb-4">
                    <div class="dropdown mb-2">
                        <button class="btn btn-outline-secondary dropdown-toggle" type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
                            {sortBy}
                        </button>
                        <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton1">
                            <li><button className="dropdown-item" onClick={() => handleSortBy("To Watch")}>To Watch</button></li>
                            <li><button className="dropdown-item" onClick={() => handleSortBy("Watched")}>Watched</button></li>
                        </ul>
                    </div>
                    <div className="list-group list-group-light">
                        {movies.map((movie) => (
                            <li key={movie.id} className="list-group-item rounded mb-2 mt-2 shadow p-3 bg-white d-flex justify-content-between align-items-center">
                                <div className="form-check">
                                    <input className="form-check-input" type="checkbox" value={movie.watched} id={`checkboxExample${movie.id}`} checked={movie.watched} onChange={() => handleToggleWatched(movie.id, movie.watched)} />
                                    <label className="form-check-label ml-2 fw-bold" htmlFor={`checkboxExample${movie.id}`}>{movie.name}</label>
                                </div>
                                <button className="btn btn-outline-danger" onClick={() => handleRemoveMovie(movie.id)}>X</button>
                            </li>
                        ))}
                    </div>
                </div>
                <div className="text-center">
                    <a className="btn btn-primary" href="./searchmovie">Add Movie</a>
                </div>
            </div>
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossorigin="anonymous"></script>
        </div>
    )
};

export default Movies;