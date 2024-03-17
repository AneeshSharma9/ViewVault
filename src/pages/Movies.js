import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import { auth, db } from "../utils/firebase"
import { ref, get, remove } from "firebase/database";

const Movies = () => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uid, setUid] = useState(null);

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
                    name: movieData[key].movietitle
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

                <h1 className="text-center">Movies</h1>

                <div className="pt-2 pb-4">
                    <div className="list-group list-group-light">
                        {movies.map((movie) => (
                            <li key={movie.id} className="list-group-item rounded m-2 shadow p-3 bg-white d-flex justify-content-between align-items-center">
                                <div className="form-check">
                                    <input className="form-check-input" type="checkbox" value="" id={`checkboxExample${movie.id}`} />
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
        </div>
    )
};

export default Movies;