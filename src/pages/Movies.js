import { useState, useEffect, useMemo } from "react";
import Navbar from "./Navbar";
import { auth, db } from "../utils/firebase"
import { ref, get, remove, update, push } from "firebase/database";
import { useNavigate, useSearchParams } from 'react-router-dom';
import Footer from "./Footer";
import axios from "axios";
import EditWatchSites from "../components/EditWatchSites";
import EditStreamingServices from "../components/EditStreamingServices";
import MediaCard from "../components/MediaCard";
import ClearWatchlistModal from "../components/ClearWatchlistModal";
import RemoveMediaModal from "../components/RemoveMediaModal";

const Movies = () => {
    const [searchParams] = useSearchParams();
    const listId = searchParams.get('list');

    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uid, setUid] = useState(null);
    const [sortBy, setSortBy] = useState("Default");
    const [listName, setListName] = useState("Movie Watchlist");
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportText, setExportText] = useState("");
    const [showImportModal, setShowImportModal] = useState(false);
    const [importText, setImportText] = useState("");
    const [importStatus, setImportStatus] = useState("");
    const [isImporting, setIsImporting] = useState(false);
    const [showClearModal, setShowClearModal] = useState(false);
    const [showSitesModal, setShowSitesModal] = useState(false);
    const [showDeleteMovieModal, setShowDeleteMovieModal] = useState(false);
    const [movieToDelete, setMovieToDelete] = useState(null);
    const [watchSites, setWatchSites] = useState([
        { name: "Lookmovie", url: "https://lookmovie.foundation/movies/search/?q=", format: "%20" },
        { name: "DopeBox", url: "https://dopebox.to/search/", format: "-" }
    ]);
    const [showStreamingModal, setShowStreamingModal] = useState(false);
    const [availableProviders, setAvailableProviders] = useState([]);
    const [selectedProviders, setSelectedProviders] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshStatus, setRefreshStatus] = useState("");
    const [streamingFilter, setStreamingFilter] = useState([]);

    // Rating Modal State
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [ratingInput, setRatingInput] = useState("");
    const [movieToRate, setMovieToRate] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                const uid = user.uid;
                setUid(uid);
                fetchMovies(uid);
                fetchWatchSites(uid);
                fetchAvailableProviders();
                fetchSelectedProviders(uid);
                if (listId) {
                    fetchListName(uid, 'custom');
                } else {
                    initializeDefaultWatchlist(uid);
                    fetchListName(uid, 'default');
                }
            } else {
                setUid(null);
                setLoading(false);
            }
        });
        return () => unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [listId]);

    const getMoviesPath = (uid) => {
        if (listId) {
            return `users/${uid}/customwatchlists/${listId}/items`;
        }
        return `users/${uid}/defaultwatchlists/movies/items`;
    };

    const initializeDefaultWatchlist = async (uid) => {
        try {
            const defaultListRef = ref(db, `users/${uid}/defaultwatchlists/movies`);
            const snapshot = await get(defaultListRef);
            if (!snapshot.exists() || !snapshot.val().name) {
                // Initialize with name, type, and createdAt if not exists
                await update(defaultListRef, {
                    name: "Movies",
                    type: "movies",
                    createdAt: snapshot.exists() ? (snapshot.val().createdAt || Date.now()) : Date.now()
                });
            }
        } catch (error) {
            console.error('Error initializing default watchlist:', error);
        }
    };

    const fetchListName = async (uid, listType) => {
        try {
            const listPath = listType === 'custom'
                ? `users/${uid}/customwatchlists/${listId}`
                : `users/${uid}/defaultwatchlists/movies`;
            const listRef = ref(db, listPath);
            const snapshot = await get(listRef);
            if (snapshot.exists()) {
                const data = snapshot.val();
                setListName(data.name || (listType === 'custom' ? "Custom Watchlist" : "Movie Watchlist"));
            } else {
                setListName(listType === 'custom' ? "Custom Watchlist" : "Movie Watchlist");
            }
        } catch (error) {
            console.error('Error fetching list name:', error);
        }
    };

    const fetchMovies = async (uid) => {
        try {
            const moviesRef = ref(db, getMoviesPath(uid));
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
                    vote_average: movieData[key].voteaverage,
                    genres: movieData[key].genres,
                    releaseyear: movieData[key].releaseyear,
                    imdbid: movieData[key].imdbid,
                    poster_path: movieData[key].poster_path,
                    user_rating: movieData[key].user_rating
                }));
                setMovies(movieArray);
            } else {
                console.log("No movies available");
                setMovies([]);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching movies:', error);
        }
    };

    const fetchWatchSites = async (uid) => {
        try {
            const sitesRef = ref(db, `users/${uid}/settings/movies/watchsites`);
            const snapshot = await get(sitesRef);
            if (snapshot.exists()) {
                const sitesData = snapshot.val();
                setWatchSites(sitesData);
            }
        } catch (error) {
            console.error('Error fetching watch sites:', error);
        }
    };

    const fetchAvailableProviders = async () => {
        try {
            const response = await axios.get(`https://api.themoviedb.org/3/watch/providers/movie`, {
                params: {
                    api_key: process.env.REACT_APP_API_KEY,
                    watch_region: 'US'
                }
            });
            const providers = response.data.results || [];
            // Sort alphabetically by provider name
            providers.sort((a, b) => a.provider_name.localeCompare(b.provider_name));
            setAvailableProviders(providers);
        } catch (error) {
            console.error('Error fetching available providers:', error);
        }
    };

    const fetchSelectedProviders = async (uid) => {
        try {
            const providersRef = ref(db, `users/${uid}/settings/movies/streamingservices`);
            const snapshot = await get(providersRef);
            if (snapshot.exists()) {
                setSelectedProviders(snapshot.val() || []);
            }
        } catch (error) {
            console.error('Error fetching selected providers:', error);
        }
    };

    const getProviderLogo = (providerName) => {
        const provider = availableProviders.find(p => p.provider_name === providerName);
        return provider?.logo_path ? `https://image.tmdb.org/t/p/w45${provider.logo_path}` : null;
    };

    const handleSaveProviders = async (updatedProviders) => {
        try {
            await update(ref(db, `users/${uid}/settings/movies`), { streamingservices: updatedProviders });
            setSelectedProviders(updatedProviders);
            setShowStreamingModal(false);
        } catch (error) {
            console.error('Error saving streaming services:', error);
        }
    };

    const handleDeleteClick = (movie) => {
        setMovieToDelete(movie);
        setShowDeleteMovieModal(true);
    };

    const handleConfirmDeleteMovie = () => {
        if (!movieToDelete) return;

        const movieRef = ref(db, `${getMoviesPath(uid)}/${movieToDelete.id}`);
        remove(movieRef)
            .then(() => {
                console.log('Movie removed successfully!');
                setMovies(movies.filter(movie => movie.id !== movieToDelete.id));
                setShowDeleteMovieModal(false);
                setMovieToDelete(null);
            })
            .catch((error) => {
                console.error('Error removing movie:', error);
            });
    };

    const handleToggleWatched = async (movie_obj, watched) => {
        // If we are marking as watched (current status is unwatched/false), open the modal
        if (!watched) {
            setMovieToRate(movie_obj);
            setRatingInput(""); // Reset input
            setShowRatingModal(true);
        } else {
            // Unmarking as watched (watched -> unwatched)
            // Just carry out the normal update to set watched = false and remove rating
            try {
                const movieRef = ref(db, `${getMoviesPath(uid)}/${movie_obj.id}`);
                await update(movieRef, { watched: false, user_rating: null });
                setMovies(movies.map(movie => {
                    if (movie.id === movie_obj.id) {
                        return { ...movie, watched: false, user_rating: null };
                    }
                    return movie;
                }));
            } catch (error) {
                console.error('Error updating watched status:', error);
            }
        }
    };

    const handleRatingChange = (e) => {
        const val = e.target.value;
        if (val === "") {
            setRatingInput("");
            return;
        }
        const num = parseFloat(val);
        if (val.includes("-")) return;
        if (num < 0 || num > 10) return;

        // Check decimals
        const parts = val.split('.');
        if (parts.length === 2 && parts[1].length > 1) return;

        setRatingInput(val);
    };

    const handleSaveRating = async () => {
        if (!movieToRate) return;

        let ratingVal = parseFloat(ratingInput);
        if (isNaN(ratingVal) || ratingVal < 0) ratingVal = 0;
        if (ratingVal > 10) ratingVal = 10;

        // Round to 1 decimal place
        ratingVal = Math.round(ratingVal * 10) / 10;

        try {
            const movieRef = ref(db, `${getMoviesPath(uid)}/${movieToRate.id}`);
            await update(movieRef, { watched: true, user_rating: ratingVal });

            setMovies(movies.map(movie => {
                if (movie.id === movieToRate.id) {
                    return { ...movie, watched: true, user_rating: ratingVal };
                }
                return movie;
            }));

            setShowRatingModal(false);
            setMovieToRate(null);
        } catch (error) {
            console.error('Error saving rating:', error);
        }
    };

    const handleSortBy = (value) => {
        setSortBy(value);
        // Sorting is now handled in the filteredMovies useMemo
    };

    const handleStreamingFilterToggle = (provider) => {
        setStreamingFilter(prev => {
            if (prev.includes(provider)) {
                return prev.filter(p => p !== provider);
            } else {
                return [...prev, provider];
            }
        });
    };

    const handleSelectAllStreaming = () => {
        if (streamingFilter.length === 0 || streamingFilter.length === selectedProviders.length) {
            // If all are selected or none are selected, clear the filter (show all)
            setStreamingFilter([]);
        } else {
            // Otherwise, select all providers
            setStreamingFilter([...selectedProviders]);
        }
    };

    const getStreamingFilterButtonText = () => {
        if (streamingFilter.length === 0) {
            return "All";
        } else if (streamingFilter.length === selectedProviders.length) {
            return "All";
        } else if (streamingFilter.length === 1) {
            return streamingFilter[0];
        } else {
            return `${streamingFilter.length} selected`;
        }
    };


    const navigate = useNavigate();

    const toComponentB = (movie) => {
        navigate('/recommendedmovies', { state: movie });
    };

    const openWatchSite = (movieName, site) => {
        const formattedMovieName = movieName.replace(/ /g, site.format);
        const url = `${site.url}${formattedMovieName}`;
        window.open(url, '_blank');
    };

    const handleSaveSites = async (updatedSites) => {
        try {
            await update(ref(db, `users/${uid}/settings/movies`), { watchsites: updatedSites });
            setWatchSites(updatedSites);
            setShowSitesModal(false);
        } catch (error) {
            console.error('Error saving watch sites:', error);
        }
    };

    const toImdbParentsGuide = (imdbId) => {
        const imdbUrl = `https://www.imdb.com/title/${imdbId}/parentalguide/#nudity`;
        window.open(imdbUrl, '_blank');
    };


    const exportWatchlist = () => {
        const lines = movies.map(movie => {
            const year = movie.releaseyear && movie.releaseyear !== "" ? ` (${movie.releaseyear})` : "";
            const watchedStatus = movie.watched ? " [x]" : " []";
            const rating = (movie.watched && movie.user_rating !== undefined && movie.user_rating !== null) ? ` {${movie.user_rating}}` : "";
            return `${movie.name}${year}${watchedStatus}${rating}`;
        });
        const content = lines.join("\n");
        setExportText(content);
        setShowExportModal(true);
    };

    const handleImportWatchlist = async () => {
        if (!importText.trim()) return;

        setIsImporting(true);
        setImportStatus("Starting import...");

        const lines = importText.split("\n").filter(line => line.trim());
        const existingMovieIds = movies.map(m => m.movieid);
        let added = 0;
        let skipped = 0;
        let notFound = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            setImportStatus(`Processing ${i + 1}/${lines.length}: ${line}`);

            // Parse "Title (Year) [x] {Rating}" format
            // Rating is optional and wrapped in curly braces
            const match = line.match(/^(.+?)\s*(?:\((\d{4})\))?\s*(?:\[(x?)\])?\s*(?:\{([\d.]+)\})?$/);
            if (!match) continue;

            const title = match[1].trim();
            const year = match[2];
            const isWatched = match[3] === 'x';
            const rating = match[4] ? parseFloat(match[4]) : null;

            try {
                // Search TMDB
                const response = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
                    params: {
                        api_key: process.env.REACT_APP_API_KEY,
                        query: title,
                        year: year || undefined
                    }
                });

                const results = response.data.results;
                if (results.length === 0) {
                    notFound++;
                    continue;
                }

                // Get the first matching result
                const movie = results[0];

                // Check if already in watchlist
                if (existingMovieIds.includes(movie.id)) {
                    skipped++;
                    continue;
                }

                // Fetch movie details
                const detailsResponse = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${process.env.REACT_APP_API_KEY}`);
                const movieDetails = await detailsResponse.json();
                const genreString = movieDetails.genres.map(genre => genre.name).join(' • ');

                // Get age rating
                const ratingResponse = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/release_dates?api_key=${process.env.REACT_APP_API_KEY}`);
                const movieRating = await ratingResponse.json();
                let certificationForUS = null;
                for (const result of movieRating.results) {
                    if (result.iso_3166_1 === "US") {
                        for (const releaseDate of result.release_dates) {
                            if (releaseDate.certification) {
                                certificationForUS = releaseDate.certification;
                                break;
                            }
                        }
                        break;
                    }
                }

                // Get streaming providers
                const providersResponse = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/watch/providers?api_key=${process.env.REACT_APP_API_KEY}`);
                const movieProviders = await providersResponse.json();
                let providerNames = [];
                if (movieProviders.results.US && movieProviders.results.US.flatrate) {
                    providerNames = movieProviders.results.US.flatrate.map(provider => provider.provider_name);
                }

                // Get IMDB ID
                const imdbResponse = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/external_ids?api_key=${process.env.REACT_APP_API_KEY}`);
                const imdbData = await imdbResponse.json();

                // Add to database
                const userMovieListRef = ref(db, getMoviesPath(uid));
                await push(userMovieListRef, {
                    movietitle: movie.title,
                    movieid: movie.id,
                    watched: isWatched,
                    runtime: movieDetails.runtime,
                    providers: providerNames,
                    agerating: certificationForUS,
                    voteaverage: movie.vote_average,
                    genres: genreString,
                    releaseyear: movieDetails.release_date ? movieDetails.release_date.substring(0, 4) : "",
                    imdbid: imdbData.imdb_id,
                    user_rating: rating,
                    poster_path: movie.poster_path
                });

                existingMovieIds.push(movie.id);
                added++;

            } catch (error) {
                console.error(`Error importing "${line}":`, error);
                notFound++;
            }
        }

        setImportStatus(`Done! Added: ${added}, Skipped (already in list): ${skipped}, Not found: ${notFound}`);
        setIsImporting(false);

        // Refresh the movie list
        if (added > 0) {
            fetchMovies(uid);
        }
    };

    const handleClearWatchlist = async () => {
        try {
            const movieListRef = ref(db, getMoviesPath(uid));
            await remove(movieListRef);
            setMovies([]);
            setShowClearModal(false);
        } catch (error) {
            console.error('Error clearing watchlist:', error);
        }
    };

    const handleRefreshWatchlist = async () => {
        if (movies.length === 0 || isRefreshing) return;

        setIsRefreshing(true);
        setRefreshStatus("Starting refresh...");

        for (let i = 0; i < movies.length; i++) {
            const movie = movies[i];
            setRefreshStatus(`Refreshing ${i + 1}/${movies.length}: ${movie.name}`);

            try {
                // Fetch movie details
                const detailsResponse = await fetch(`https://api.themoviedb.org/3/movie/${movie.movieid}?api_key=${process.env.REACT_APP_API_KEY}`);
                const movieDetails = await detailsResponse.json();
                const genreString = movieDetails.genres.map(genre => genre.name).join(' • ');

                // Get age rating
                const ratingResponse = await fetch(`https://api.themoviedb.org/3/movie/${movie.movieid}/release_dates?api_key=${process.env.REACT_APP_API_KEY}`);
                const movieRating = await ratingResponse.json();
                let certificationForUS = null;
                for (const result of movieRating.results) {
                    if (result.iso_3166_1 === "US") {
                        for (const releaseDate of result.release_dates) {
                            if (releaseDate.certification) {
                                certificationForUS = releaseDate.certification;
                                break;
                            }
                        }
                        break;
                    }
                }

                // Get streaming providers
                const providersResponse = await fetch(`https://api.themoviedb.org/3/movie/${movie.movieid}/watch/providers?api_key=${process.env.REACT_APP_API_KEY}`);
                const movieProviders = await providersResponse.json();
                let providerNames = [];
                if (movieProviders.results.US && movieProviders.results.US.flatrate) {
                    providerNames = movieProviders.results.US.flatrate.map(provider => provider.provider_name);
                }

                // Get IMDB ID
                const imdbResponse = await fetch(`https://api.themoviedb.org/3/movie/${movie.movieid}/external_ids?api_key=${process.env.REACT_APP_API_KEY}`);
                const imdbData = await imdbResponse.json();

                // Update in database
                const movieRef = ref(db, `${getMoviesPath(uid)}/${movie.id}`);
                await update(movieRef, {
                    movietitle: movieDetails.title,
                    runtime: movieDetails.runtime,
                    providers: providerNames,
                    agerating: certificationForUS,
                    voteaverage: movieDetails.vote_average,
                    genres: genreString,
                    releaseyear: movieDetails.release_date ? movieDetails.release_date.substring(0, 4) : "",
                    imdbid: imdbData.imdb_id,
                    poster_path: movieDetails.poster_path || ""
                });
            } catch (error) {
                console.error(`Error refreshing "${movie.name}":`, error);
            }
        }

        setRefreshStatus("Done! Refreshing list...");
        await fetchMovies(uid);
        setIsRefreshing(false);
        setRefreshStatus("");
    };

    // Filter and sort movies based on streaming service and sort option
    const filteredMovies = useMemo(() => {
        let result = movies;

        // Apply streaming filter
        if (streamingFilter.length > 0) {
            result = result.filter(movie =>
                movie.providers &&
                movie.providers.length > 0 &&
                streamingFilter.some(provider => movie.providers.includes(provider))
            );
        }

        // Apply sorting
        if (sortBy === "To Watch") {
            result = result.slice().sort((a, b) => {
                return a.watched - b.watched;
            });
        } else if (sortBy === "Watched") {
            result = result.slice().sort((a, b) => {
                return b.watched - a.watched;
            });
        } else if (sortBy === "Runtime") {
            result = result.slice().sort((a, b) => {
                return a.runtime - b.runtime;
            });
        } else if (sortBy === "User Rating") {
            result = result.slice().sort((a, b) => {
                const ratingA = a.user_rating || -1;
                const ratingB = b.user_rating || -1;
                return ratingB - ratingA;
            });
        } else if (sortBy === "Release Year") {
            result = result.slice().sort((a, b) => {
                const yearA = parseInt(a.releaseyear) || 9999;
                const yearB = parseInt(b.releaseyear) || 9999;
                return yearA - yearB; // Older first
            });
        }
        // "Default" - no sorting needed, keep original order

        return result;
    }, [movies, streamingFilter, sortBy]);

    return (
        <div className="">
            <style>{`
                .poster-dropdown::before,
                .poster-dropdown::after {
                    display: none !important;
                    content: "" !important;
                    border: none !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }
                button.poster-dropdown.dropdown-toggle::before,
                button.poster-dropdown.dropdown-toggle::after {
                    display: none !important;
                    content: "" !important;
                    border: none !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }
                @keyframes skeleton-loading {
                    0% { background-color: #f0f0f0; }
                    50% { background-color: #e0e0e0; }
                    100% { background-color: #f0f0f0; }
                }
                .skeleton-box {
                    animation: skeleton-loading 1.5s infinite ease-in-out;
                    background-color: #f0f0f0;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .fade-in {
                    animation: fadeIn 0.5s ease-in;
                }
            `}</style>
            <Navbar />
            <div className="container-fluid">
                <div className="container">
                    <div className="p-4">
                        {loading ? (
                            <div className="text-center m-4 d-flex justify-content-center">
                                <div className="skeleton-box rounded" style={{ width: '300px', height: '48px' }}></div>
                            </div>
                        ) : (
                            <h1 className="text-center m-4 fw-bold fade-in">{listName}</h1>
                        )}
                        <div className="pt-2 pb-4">
                            <div className="mb-3 d-flex flex-column flex-md-row justify-content-between gap-3">
                                <div className="d-flex gap-2 flex-wrap">
                                    <button className="btn btn-outline-secondary dropdown-toggle flex-fill" type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
                                        {sortBy}
                                    </button>
                                    <ul className="dropdown-menu dropdown-menu-dark" aria-labelledby="dropdownMenuButton1">
                                        <li><button className="dropdown-item" onClick={() => handleSortBy("Default")}>Default</button></li>
                                        <li><button className="dropdown-item" onClick={() => handleSortBy("To Watch")}>To Watch</button></li>
                                        <li><button className="dropdown-item" onClick={() => handleSortBy("Watched")}>Watched</button></li>
                                        <li><button className="dropdown-item" onClick={() => handleSortBy("Runtime")}>Runtime</button></li>
                                        <li><button className="dropdown-item" onClick={() => handleSortBy("User Rating")}>User Rating</button></li>
                                        <li><button className="dropdown-item" onClick={() => handleSortBy("Release Year")}>Release Year</button></li>
                                    </ul>
                                    <button className="btn btn-outline-secondary dropdown-toggle flex-fill" type="button" id="dropdownMenuButton2" data-bs-toggle="dropdown" aria-expanded="false">
                                        {getStreamingFilterButtonText()}
                                    </button>
                                    <ul className="dropdown-menu dropdown-menu-dark" aria-labelledby="dropdownMenuButton2" style={{ minWidth: '200px', maxHeight: '300px', overflowY: 'auto' }}>
                                        <li>
                                            <label className="dropdown-item" style={{ cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input me-2"
                                                    checked={streamingFilter.length === 0 || (streamingFilter.length === selectedProviders.length && selectedProviders.length > 0)}
                                                    onChange={handleSelectAllStreaming}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                All
                                            </label>
                                        </li>
                                        {selectedProviders.length > 0 && <li><hr className="dropdown-divider" /></li>}
                                        {selectedProviders.length > 0 ? (
                                            selectedProviders.map((provider) => (
                                                <li key={provider}>
                                                    <label className="dropdown-item" style={{ cursor: 'pointer' }}>
                                                        <input
                                                            type="checkbox"
                                                            className="form-check-input me-2"
                                                            checked={streamingFilter.includes(provider)}
                                                            onChange={() => handleStreamingFilterToggle(provider)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        {provider}
                                                    </label>
                                                </li>
                                            ))
                                        ) : (
                                            <li><span className="dropdown-item-text text-muted">No streaming services enabled</span></li>
                                        )}
                                    </ul>
                                    <div className="dropdown flex-fill">
                                        <button className="btn btn-outline-secondary dropdown-toggle w-100" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                            ⋯
                                        </button>
                                        <ul className="dropdown-menu dropdown-menu-end">
                                            <li><button className="dropdown-item" onClick={() => { setShowImportModal(true); setImportText(""); setImportStatus(""); }}>Import Watchlist</button></li>
                                            <li><button className="dropdown-item" onClick={exportWatchlist}>Export Watchlist</button></li>
                                            <li><hr className="dropdown-divider" /></li>
                                            <li><button className="dropdown-item" onClick={() => setShowStreamingModal(true)}>Edit Streaming Services</button></li>
                                            <li><button className="dropdown-item" onClick={() => setShowSitesModal(true)}>Edit Watch Sites</button></li>
                                            <li><hr className="dropdown-divider" /></li>
                                            <li>
                                                <button className="dropdown-item" onClick={handleRefreshWatchlist} disabled={isRefreshing || movies.length === 0}>
                                                    {isRefreshing ? refreshStatus : "Refresh Watchlist"}
                                                </button>
                                            </li>
                                            <li><button className="dropdown-item text-danger" onClick={() => setShowClearModal(true)}>Clear Watchlist</button></li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="d-flex gap-2 flex-wrap">
                                    <a className="btn btn-primary flex-fill" href="./searchmovie">Add Movie</a>
                                </div>
                            </div>
                            <div className="list-group list-group-light">
                                {loading ? (
                                    // Skeleton Loader
                                    Array(5).fill(0).map((_, index) => (
                                        <div key={index} className="list-group-item rounded mb-2 mt-2 shadow-sm p-3 bg-white d-flex align-items-start">
                                            {/* Poster Skeleton */}
                                            <div className="skeleton-box rounded flex-shrink-0" style={{ width: '100px', height: '150px' }}></div>

                                            {/* Content Skeleton */}
                                            <div className="flex-grow-1 ms-3" style={{ minWidth: 0 }}>
                                                {/* Header Row */}
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <div className="skeleton-box rounded" style={{ width: '60%', height: '28px' }}></div>
                                                    <div className="skeleton-box rounded" style={{ width: '24px', height: '24px' }}></div>
                                                </div>

                                                {/* Meta Row */}
                                                <div className="d-flex gap-2 mb-2">
                                                    <div className="skeleton-box rounded" style={{ width: '30%', height: '22px' }}></div>
                                                    <div className="skeleton-box rounded" style={{ width: '20%', height: '22px' }}></div>
                                                </div>

                                                {/* Genre Row */}
                                                <div className="skeleton-box rounded mb-2" style={{ width: '50%', height: '18px' }}></div>

                                                {/* Actions Row */}
                                                <div className="d-flex justify-content-end mt-2">
                                                    <div className="skeleton-box rounded" style={{ width: '20%', height: '18px' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    filteredMovies.map((movie) => (
                                        <MediaCard
                                            key={movie.id}
                                            item={movie}
                                            type="movie"
                                            watchSites={watchSites}
                                            selectedProviders={selectedProviders}
                                            getProviderLogo={getProviderLogo}
                                            handleToggleWatched={handleToggleWatched}
                                            handleDeleteClick={handleDeleteClick}
                                            toComponentB={toComponentB}
                                            openWatchSite={openWatchSite}
                                            toImdbParentsGuide={toImdbParentsGuide}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                        <div className="text-center mb-5 ">
                            <a className="btn btn-primary" href="./searchmovie">Add Movie</a>
                        </div>
                    </div>
                </div>
            </div>

            {
                showExportModal && (
                    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Export Watchlist</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowExportModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                    <textarea
                                        className="form-control"
                                        rows="10"
                                        value={exportText}
                                        readOnly
                                    />
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowExportModal(false)}>Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showImportModal && (
                    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Import Watchlist</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowImportModal(false)} disabled={isImporting}></button>
                                </div>
                                <div className="modal-body">
                                    <p className="text-muted small mb-2">Enter one movie per line in the format: <code>Title (Year) [x] {'{Rating}'}</code> for watched or <code>Title (Year) []</code> for not watched</p>
                                    <textarea
                                        className="form-control"
                                        rows="10"
                                        value={importText}
                                        onChange={(e) => setImportText(e.target.value)}
                                        placeholder="The Shawshank Redemption (1994) [x] {10}&#10;Inception (2010) []&#10;The Dark Knight (2008) [x] {9.5}"
                                        disabled={isImporting}
                                    />
                                    {importStatus && (
                                        <div className={`mt-2 small ${importStatus.startsWith("Done") ? "text-success" : "text-info"}`}>
                                            {importStatus}
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowImportModal(false)} disabled={isImporting}>Close</button>
                                    <button type="button" className="btn btn-primary" onClick={handleImportWatchlist} disabled={isImporting || !importText.trim()}>
                                        {isImporting ? "Importing..." : "Import"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showRatingModal && (
                    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Rate Movie</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowRatingModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                    <p>Rate <strong>{movieToRate?.name}</strong> from 0 to 10.</p>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={ratingInput}
                                        onChange={handleRatingChange}
                                        min="0"
                                        max="10"
                                        step="0.1"
                                        placeholder="Enter rating (e.g. 7.5)"
                                        autoFocus
                                    />
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowRatingModal(false)}>Cancel</button>
                                    <button type="button" className="btn btn-primary" onClick={handleSaveRating}>Save as Watched</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            <ClearWatchlistModal
                show={showClearModal}
                onHide={() => setShowClearModal(false)}
                onConfirm={handleClearWatchlist}
                listName={listName}
            />

            <EditStreamingServices
                show={showStreamingModal}
                onHide={() => setShowStreamingModal(false)}
                availableProviders={availableProviders}
                selectedProviders={selectedProviders}
                onSave={handleSaveProviders}
            />

            <EditWatchSites
                show={showSitesModal}
                onHide={() => setShowSitesModal(false)}
                watchSites={watchSites}
                onSave={handleSaveSites}
            />

            <RemoveMediaModal
                show={showDeleteMovieModal}
                onHide={() => { setShowDeleteMovieModal(false); setMovieToDelete(null); }}
                onConfirm={handleConfirmDeleteMovie}
                itemName={movieToDelete?.name}
                type="movie"
            />

            <Footer></Footer>
        </div >
    )
};

export default Movies;
