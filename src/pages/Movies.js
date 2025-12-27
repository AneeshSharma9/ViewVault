import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import { auth, db } from "../utils/firebase"
import { ref, get, remove, update, push } from "firebase/database";
import { useNavigate } from 'react-router-dom';
import Footer from "./Footer";
import axios from "axios";

const Movies = () => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uid, setUid] = useState(null);
    const [sortBy, setSortBy] = useState("Default");
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportText, setExportText] = useState("");
    const [showImportModal, setShowImportModal] = useState(false);
    const [importText, setImportText] = useState("");
    const [importStatus, setImportStatus] = useState("");
    const [isImporting, setIsImporting] = useState(false);
    const [showClearModal, setShowClearModal] = useState(false);
    const [showSitesModal, setShowSitesModal] = useState(false);
    const [watchSites, setWatchSites] = useState([
        { name: "Lookmovie", url: "https://lookmovie.foundation/movies/search/?q=", format: "%20" },
        { name: "DopeBox", url: "https://dopebox.to/search/", format: "-" }
    ]);
    const [editingSites, setEditingSites] = useState([]);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                const uid = user.uid;
                setUid(uid);
                fetchMovies(uid);
                fetchWatchSites(uid);
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
                    vote_average: movieData[key].voteaverage,
                    genres: movieData[key].genres,
                    releaseyear: movieData[key].releaseyear,
                    imdbid: movieData[key].imdbid
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

    const fetchWatchSites = async (uid) => {
        try {
            const sitesRef = ref(db, `users/${uid}/movielist/watchsites`);
            const snapshot = await get(sitesRef);
            if (snapshot.exists()) {
                const sitesData = snapshot.val();
                setWatchSites(sitesData);
            }
        } catch (error) {
            console.error('Error fetching watch sites:', error);
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

    const openWatchSite = (movieName, site) => {
        const formattedMovieName = movieName.replace(/ /g, site.format);
        const url = `${site.url}${formattedMovieName}`;
        window.open(url, '_blank');
    };

    const openEditSitesModal = () => {
        setEditingSites(JSON.parse(JSON.stringify(watchSites)));
        setShowSitesModal(true);
    };

    const handleSiteChange = (index, field, value) => {
        const updated = [...editingSites];
        updated[index][field] = value;
        setEditingSites(updated);
    };

    const handleSaveSites = async () => {
        try {
            await update(ref(db, `users/${uid}/movielist`), { watchsites: editingSites });
            setWatchSites(editingSites);
            setShowSitesModal(false);
        } catch (error) {
            console.error('Error saving watch sites:', error);
        }
    };
    
    const toImdbParentsGuide = (imdbId) => {
        const imdbUrl = `https://www.imdb.com/title/${imdbId}/parentalguide/#nudity`;
        window.open(imdbUrl, '_blank');
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

    const exportWatchlist = () => {
        const lines = movies.map(movie => {
            const year = movie.releaseyear && movie.releaseyear !== "" ? ` (${movie.releaseyear})` : "";
            const watchedStatus = movie.watched ? " [x]" : " []";
            return `${movie.name}${year}${watchedStatus}`;
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
            
            // Parse "Title (Year) [x]" or "Title (Year) []" format
            // Also handles "Title (Year)" without watched status (defaults to not watched)
            const match = line.match(/^(.+?)\s*(?:\((\d{4})\))?\s*(?:\[(x?)\])?$/);
            if (!match) continue;
            
            const title = match[1].trim();
            const year = match[2];
            const isWatched = match[3] === 'x';
            
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
                const genreString = movieDetails.genres.map(genre => genre.name).join(' / ');
                
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
                const userMovieListRef = ref(db, `users/${uid}/movielist`);
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
                    imdbid: imdbData.imdb_id
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
            const movieListRef = ref(db, `users/${uid}/movielist`);
            await remove(movieListRef);
            setMovies([]);
            setShowClearModal(false);
        } catch (error) {
            console.error('Error clearing watchlist:', error);
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
                                <div className="d-flex gap-2">
                                    <div className="dropdown">
                                        <button className="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                            ⋯
                                        </button>
                                        <ul className="dropdown-menu dropdown-menu-end">
                                            <li><button className="dropdown-item" onClick={() => { setShowImportModal(true); setImportText(""); setImportStatus(""); }}>Import Watchlist</button></li>
                                            <li><button className="dropdown-item" onClick={exportWatchlist}>Export Watchlist</button></li>
                                            <li><hr className="dropdown-divider" /></li>
                                            <li><button className="dropdown-item" onClick={openEditSitesModal}>Edit Watch Sites</button></li>
                                            <li><hr className="dropdown-divider" /></li>
                                            <li><button className="dropdown-item text-danger" onClick={() => setShowClearModal(true)}>Clear Watchlist</button></li>
                                        </ul>
                                    </div>
                                    <a className="btn btn-primary" href="./searchmovie">Add Movie</a>
                                </div>
                            </div>
                            <div className="list-group list-group-light">
                                {movies.map((movie) => (
                                    <li key={movie.id} className="list-group-item rounded mb-2 mt-2 shadow p-3 bg-white d-flex justify-content-between align-items-center">
                                        <div className="form-check">
                                            <input className="form-check-input" type="checkbox" value={movie.watched} id={`checkboxExample${movie.id}`} checked={movie.watched} onChange={() => handleToggleWatched(movie.id, movie.watched)} />
                                            <label className="form-check-label ml-2" htmlFor={`checkboxExample${movie.id}`}><span className="fw-bold">{movie.name}</span> ({movie.releaseyear || "N/A"})</label>
                                            <div className="d-flex flex-wrap align-items-center">
                                                <span className={`m-1 badge rounded-pill ${getBackgroundColor(movie.vote_average)}`}>{(movie.vote_average * 10).toFixed(2)}%</span>
                                                {' '}
                                                <span className="m-1 badge bg-light text-dark border border-danger">{movie.agerating}</span>
                                                {' '}
                                                <span className="m-1 fst-italic">{convertMinToHrMin(movie.runtime)}</span>
                                            </div>
                                            <p className="m-1 badge bg-light text-dark border border-info">{movie.genres}</p>
                                            {movie.providers && movie.providers.length > 0 && (
                                                <p>Stream On: {movie.providers.join(', ')}</p>
                                            )}
                                        </div>
                                        <div className="d-flex align-items-center justify-content-between">
                                            <div className="btn-group dropstart m-2">
                                                <button type="button" className="btn btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">≡</button>
                                                <ul className="dropdown-menu">
                                                    <li><button className="dropdown-item" onClick={() => { toComponentB(movie) }}>More like this</button></li>
                                                    {watchSites.map((site, index) => (
                                                        <li key={index}><button className="dropdown-item" onClick={() => openWatchSite(movie.name, site)}>Stream on {site.name}</button></li>
                                                    ))}
                                                    <li><button className="dropdown-item" onClick={() => { toImdbParentsGuide(movie.imdbid) }}>IMDB Parents Guide</button></li>
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

            {showExportModal && (
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
            )}

            {showImportModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Import Watchlist</h5>
                                <button type="button" className="btn-close" onClick={() => setShowImportModal(false)} disabled={isImporting}></button>
                            </div>
                            <div className="modal-body">
                                <p className="text-muted small mb-2">Enter one movie per line in the format: <code>Title (Year) [x]</code> for watched or <code>Title (Year) []</code> for not watched</p>
                                <textarea 
                                    className="form-control" 
                                    rows="10" 
                                    value={importText}
                                    onChange={(e) => setImportText(e.target.value)}
                                    placeholder="The Shawshank Redemption (1994) [x]&#10;Inception (2010) []&#10;The Dark Knight (2008)"
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
            )}

            {showClearModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Clear Watchlist</h5>
                                <button type="button" className="btn-close" onClick={() => setShowClearModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p>Are you sure you want to clear your entire watchlist?</p>
                                <p className="text-danger fw-bold">This action cannot be undone.</p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowClearModal(false)}>Cancel</button>
                                <button type="button" className="btn btn-danger" onClick={handleClearWatchlist}>Clear Watchlist</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showSitesModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Edit Watch Sites</h5>
                                <button type="button" className="btn-close" onClick={() => setShowSitesModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                {editingSites.map((site, index) => (
                                    <div key={index} className="card mb-3">
                                        <div className="card-header fw-bold">Site {index + 1}</div>
                                        <div className="card-body">
                                            <div className="mb-3">
                                                <label className="form-label">Name</label>
                                                <input 
                                                    type="text" 
                                                    className="form-control" 
                                                    value={site.name}
                                                    onChange={(e) => handleSiteChange(index, 'name', e.target.value)}
                                                    placeholder="Site Name"
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">URL (movie name will be appended)</label>
                                                <input 
                                                    type="text" 
                                                    className="form-control" 
                                                    value={site.url}
                                                    onChange={(e) => handleSiteChange(index, 'url', e.target.value)}
                                                    placeholder="https://example.com/search/"
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">Space Replacement Format</label>
                                                <select 
                                                    className="form-select"
                                                    value={site.format}
                                                    onChange={(e) => handleSiteChange(index, 'format', e.target.value)}
                                                >
                                                    <option value="%20">%20 (URL encoded space)</option>
                                                    <option value="-">- (dash)</option>
                                                    <option value="_">_ (underscore)</option>
                                                    <option value="+">+ (plus)</option>
                                                    <option value=" ">(keep spaces)</option>
                                                </select>
                                            </div>
                                            <div className="text-muted small">
                                                Preview: <code>{site.url}The{site.format}Movie{site.format}Name</code>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowSitesModal(false)}>Cancel</button>
                                <button type="button" className="btn btn-primary" onClick={handleSaveSites}>Save Sites</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Footer></Footer>
        </div>
    )
};

export default Movies;
