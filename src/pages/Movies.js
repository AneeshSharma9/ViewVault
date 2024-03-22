import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import { auth, db } from "../utils/firebase"
import { ref, get, remove, update } from "firebase/database";
import { useNavigate } from 'react-router-dom';
import Footer from "./Footer";

const Movies = () => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uid, setUid] = useState(null);
    const [sortBy, setSortBy] = useState("Default");

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
                    movieid: movieData[key].movieid,
                    name: movieData[key].movietitle,
                    watched: movieData[key].watched,
                    runtime: movieData[key].runtime,
                    providers: movieData[key].providers,
                    agerating: movieData[key].agerating,
                    vote_average: movieData[key].voteaverage
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
        } else if (value === "Runtime") {
            const sortedMovies = movies.slice().sort((a, b) => {
                return a.runtime - b.runtime;
            });
            setMovies(sortedMovies);
        } else {
            fetchMovies(uid);
        }
    };

    const convertMinToHrMin = (minutes) => {
        if (isNaN(minutes)) {
            return "Invalid input";
        }

        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        if (hours === 0) {
            return `${remainingMinutes} mins`;
        } else if (remainingMinutes === 0) {
            return `${hours} hr`;
        } else {
            return `${hours} hr ${remainingMinutes} mins`;
        }
    };

    const navigate = useNavigate();

    const toComponentB = (movie) => {
        navigate('/recommendedmovies', { state: movie });
    };

    const toLookmovie = (movieName) => {
        const formattedMovieName = movieName.replace(/ /g, '%20');
        const lookmovieUrl = `https://lookmovie.foundation/movies/search/?q=${formattedMovieName}`;
        window.open(lookmovieUrl, '_blank');
    };

    const toDopebox = (movieName) => {
        const formattedMovieName = movieName.replace(/ /g, '-');
        const dopeboxUrl = `https://dopebox.to/search/${formattedMovieName}`;
        window.open(dopeboxUrl, '_blank');
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
            <Navbar />
            <div className="container-fluid">
                <div className="container">
                    <div className="p-4">
                        <h1 className="text-center m-4 fw-bold">Movie Watchlist</h1>
                        <div className="pt-2 pb-4">
                            <div className="dropdown mb-2 d-flex justify-content-between">
                                <button className="btn btn-outline-secondary dropdown-toggle" type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
                                    {sortBy}
                                </button>
                                <ul className="dropdown-menu dropdown-menu-dark" aria-labelledby="dropdownMenuButton1">
                                    <li><button className="dropdown-item" onClick={() => handleSortBy("Default")}>Default</button></li>
                                    <li><button className="dropdown-item" onClick={() => handleSortBy("To Watch")}>To Watch</button></li>
                                    <li><button className="dropdown-item" onClick={() => handleSortBy("Watched")}>Watched</button></li>
                                    <li><button className="dropdown-item" onClick={() => handleSortBy("Runtime")}>Runtime</button></li>
                                </ul>
                                <a className="btn btn-primary" href="./searchmovie">Add Movie</a>
                            </div>
                            <div className="list-group list-group-light">
                                {movies.map((movie) => (
                                    <li key={movie.id} className="list-group-item rounded mb-2 mt-2 shadow p-3 bg-white d-flex justify-content-between align-items-center">
                                        <div className="form-check">
                                            <input className="form-check-input" type="checkbox" value={movie.watched} id={`checkboxExample${movie.id}`} checked={movie.watched} onChange={() => handleToggleWatched(movie.id, movie.watched)} />
                                            <label className="form-check-label ml-2 fw-bold" htmlFor={`checkboxExample${movie.id}`}>{movie.name}</label>
                                            <div className="d-flex align-items-center">
                                                <span className={`m-1 badge rounded-pill ${getBackgroundColor(movie.vote_average)}`}>{(movie.vote_average * 10).toFixed(2)}%</span>
                                                {' '}
                                                <span className="m-1 badge bg-light text-dark border border-danger">{movie.agerating}</span>
                                                {' '}
                                                <span className="m-1 fst-italic">{convertMinToHrMin(movie.runtime)}</span>
                                            </div>
                                            {movie.providers && movie.providers.length > 0 && (
                                                <p>Stream On: {movie.providers.join(', ')}</p>
                                            )}
                                        </div>
                                        <div className="d-flex align-items-center justify-content-between">
                                            <div className="btn-group dropstart m-2">
                                                <button type="button" className="btn btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">≡</button>
                                                <ul className="dropdown-menu">
                                                    <li><button className="dropdown-item" onClick={() => { toComponentB(movie) }}>More like this</button></li>
                                                    <li><button className="dropdown-item" onClick={() => { toDopebox(movie.name) }}>Stream on DopeBox</button></li>
                                                    <li><button className="dropdown-item" onClick={() => { toLookmovie(movie.name) }}>Stream on Lookmovie</button></li>
                                                </ul>
                                            </div>
                                            <button className="btn btn-outline-danger" onClick={() => handleRemoveMovie(movie.id)}>X</button>
                                        </div>
                                    </li>
                                ))}
                            </div>
                        </div>
                        <div className="text-center mb-5 ">
                            <a className="btn btn-primary" href="./searchmovie">Add Movie</a>
                        </div>
                    </div>
                </div>
            </div>
            <Footer></Footer>
        </div>
    )
};

export default Movies;