import { useState } from "react";
import Navbar from "./Navbar";
import { useNavigate, useSearchParams } from 'react-router-dom';
import Footer from "./Footer";
import MediaCard from "../components/MediaCard";
import RatingModal from "../components/RatingModal";
import ExportModal from "../components/ExportModal";
import ImportModal from "../components/ImportModal";
import ClearWatchlistModal from "../components/ClearWatchlistModal";
import RemoveMediaModal from "../components/RemoveMediaModal";
import MediaFilters from "../components/MediaFilters";
import EditWatchSites from "../components/EditWatchSites";
import EditStreamingServices from "../components/EditStreamingServices";
import ScrollControls from "../components/ScrollControls";
import useWatchlist from "../hooks/useWatchlist";
import axios from "axios";
import { db } from "../utils/firebase";
import { ref, push, update } from "firebase/database";

const Movies = () => {
    const [searchParams] = useSearchParams();
    const listId = searchParams.get('list');
    const navigate = useNavigate();

    const {
        items: movies,
        filteredItems: filteredMovies,
        loading,
        uid,
        listName,
        watchSites,
        availableProviders,
        selectedProviders,
        streamingFilter,
        setStreamingFilter,
        sortBy,
        handleSortBy,
        isRefreshing,
        setIsRefreshing,
        refreshStatus,
        setRefreshStatus,
        handleToggleWatched: baseToggleWatched,
        handleDelete,
        handleClear,
        handleSaveProviders,
        handleSaveSites,
        refreshData
    } = useWatchlist('movie', listId);

    // Local UI State
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportText, setExportText] = useState("");
    const [showImportModal, setShowImportModal] = useState(false);
    const [importText, setImportText] = useState("");
    const [importStatus, setImportStatus] = useState("");
    const [isImporting, setIsImporting] = useState(false);
    const [showClearModal, setShowClearModal] = useState(false);
    const [showSitesModal, setShowSitesModal] = useState(false);
    const [showStreamingModal, setShowStreamingModal] = useState(false);
    const [showDeleteMovieModal, setShowDeleteMovieModal] = useState(false);
    const [movieToDelete, setMovieToDelete] = useState(null);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [movieToRate, setMovieToRate] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter movies by search query
    const searchFilteredMovies = searchQuery.trim()
        ? filteredMovies.filter(movie =>
            movie.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : filteredMovies;

    const getProviderLogo = (providerName) => {
        const provider = availableProviders.find(p => p.provider_name === providerName);
        return provider?.logo_path ? `https://image.tmdb.org/t/p/w45${provider.logo_path}` : null;
    };

    const handleToggleWatched = (movie, watched) => {
        if (!watched) {
            setMovieToRate(movie);
            setShowRatingModal(true);
        } else {
            baseToggleWatched(movie, true);
        }
    };

    const handleSaveRating = async (ratingVal) => {
        if (!movieToRate) return;
        await baseToggleWatched(movieToRate, false, ratingVal);
        setShowRatingModal(false);
        setMovieToRate(null);
    };

    const handleDeleteClick = (movie) => {
        setMovieToDelete(movie);
        setShowDeleteMovieModal(true);
    };

    const handleConfirmDeleteMovie = async () => {
        if (movieToDelete) {
            await handleDelete(movieToDelete.id);
            setShowDeleteMovieModal(false);
            setMovieToDelete(null);
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
                const detailsResponse = await axios.get(`https://api.themoviedb.org/3/movie/${movie.movieid}`, {
                    params: { api_key: process.env.REACT_APP_API_KEY }
                });
                const movieDetails = detailsResponse.data;
                const genreString = movieDetails.genres.map(genre => genre.name).join(' • ');

                const ratingResponse = await axios.get(`https://api.themoviedb.org/3/movie/${movie.movieid}/release_dates`, {
                    params: { api_key: process.env.REACT_APP_API_KEY }
                });
                let certificationForUS = null;
                const releaseDates = ratingResponse.data.results.find(r => r.iso_3166_1 === "US");
                if (releaseDates) certificationForUS = releaseDates.release_dates[0]?.certification;

                const providersResponse = await axios.get(`https://api.themoviedb.org/3/movie/${movie.movieid}/watch/providers`, {
                    params: { api_key: process.env.REACT_APP_API_KEY }
                });
                let providerNames = [];
                if (providersResponse.data.results.US?.flatrate) {
                    providerNames = providersResponse.data.results.US.flatrate.map(p => p.provider_name);
                }

                const imdbResponse = await axios.get(`https://api.themoviedb.org/3/movie/${movie.movieid}/external_ids`, {
                    params: { api_key: process.env.REACT_APP_API_KEY }
                });

                const movieRef = ref(db, `${listId ? `users/${uid}/customwatchlists/${listId}` : `users/${uid}/defaultwatchlists/movies`}/items/${movie.id}`);
                await update(movieRef, {
                    movietitle: movieDetails.title,
                    runtime: movieDetails.runtime,
                    providers: providerNames,
                    agerating: certificationForUS,
                    voteaverage: movieDetails.vote_average,
                    genres: genreString,
                    releaseyear: movieDetails.release_date?.substring(0, 4),
                    imdbid: imdbResponse.data.imdb_id,
                    poster_path: movieDetails.poster_path
                });
            } catch (error) {
                console.error(`Error refreshing "${movie.name}":`, error);
            }
        }
        setRefreshStatus("");
        setIsRefreshing(false);
        refreshData();
    };

    const exportWatchlist = () => {
        const content = movies.map(m => `${m.name}${m.releaseyear ? ` (${m.releaseyear})` : ""} ${m.watched ? "[x]" : "[]"}${m.user_rating ? ` {${m.user_rating}}` : ""}`).join("\n");
        setExportText(content);
        setShowExportModal(true);
    };

    const handleImportWatchlist = async () => {
        if (!importText.trim()) return;
        setIsImporting(true);
        setImportStatus("Importing...");
        const lines = importText.split("\n").filter(l => l.trim());
        const existingIds = movies.map(m => m.movieid);

        for (const line of lines) {
            const match = line.match(/^(.+?)\s*(?:\((\d{4})\))?\s*(?:\[(x?)\])?\s*(?:\{([\d.]+)\})?$/);
            if (!match) continue;
            const [, title, year, watched, rating] = match;

            try {
                const searchRes = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
                    params: { api_key: process.env.REACT_APP_API_KEY, query: title, year }
                });
                const movie = searchRes.data.results[0];
                if (!movie || existingIds.includes(movie.id)) continue;

                const detailsRes = await axios.get(`https://api.themoviedb.org/3/movie/${movie.id}`, {
                    params: { api_key: process.env.REACT_APP_API_KEY }
                });
                const providersRes = await axios.get(`https://api.themoviedb.org/3/movie/${movie.id}/watch/providers`, {
                    params: { api_key: process.env.REACT_APP_API_KEY }
                });
                const imdbRes = await axios.get(`https://api.themoviedb.org/3/movie/${movie.id}/external_ids`, {
                    params: { api_key: process.env.REACT_APP_API_KEY }
                });

                const movieRef = ref(db, `${listId ? `users/${uid}/customwatchlists/${listId}` : `users/${uid}/defaultwatchlists/movies`}/items`);
                await push(movieRef, {
                    movietitle: movie.title,
                    movieid: movie.id,
                    watched: !!watched,
                    runtime: detailsRes.data.runtime,
                    providers: providersRes.data.results.US?.flatrate?.map(p => p.provider_name) || [],
                    voteaverage: movie.vote_average,
                    genres: detailsRes.data.genres.map(g => g.name).join(' • '),
                    releaseyear: detailsRes.data.release_date?.substring(0, 4),
                    imdbid: imdbRes.data.imdb_id,
                    user_rating: rating ? parseFloat(rating) : null,
                    poster_path: movie.poster_path
                });
            } catch (e) { console.error(e); }
        }
        setIsImporting(false);
        setImportStatus("Done!");
        refreshData();
    };

    return (
        <div className="fade-in">
            <Navbar />
            <div className="search-hero">
                <div className="container">
                    {loading ? (
                        <div className="d-flex justify-content-center mb-3">
                            <div className="skeleton-box rounded" style={{ width: '300px', height: '4rem' }}></div>
                        </div>
                    ) : (
                        <h1 className="search-title-premium animate-fade-in">{listName || "Movie Vault"}</h1>
                    )}
                    <p className="text-muted fs-5 animate-slide-up">Manage and explore your cinematic collection.</p>
                </div>
            </div>

            <div className="container pb-5">
                <div className="pb-4">
                    <MediaFilters
                        sortBy={sortBy}
                        onSortChange={handleSortBy}
                        sortOptions={["Default", "To Watch", "Watched", "Runtime", "User Rating", "Release Year"]}
                        streamingFilter={streamingFilter}
                        selectedProviders={selectedProviders}
                        onSelectAllStreaming={() => {
                            if (streamingFilter.length === selectedProviders.length) setStreamingFilter([]);
                            else setStreamingFilter(selectedProviders);
                        }}
                        onStreamingFilterToggle={(p) => setStreamingFilter(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                        streamingFilterButtonText={streamingFilter.length === 0 ? "All" : streamingFilter.length === 1 ? streamingFilter[0] : `${streamingFilter.length} Selected`}
                        onImport={() => { setShowImportModal(true); setImportText(""); setImportStatus(""); }}
                        onExport={exportWatchlist}
                        onEditProviders={() => setShowStreamingModal(true)}
                        onEditSites={() => setShowSitesModal(true)}
                        onRefresh={handleRefreshWatchlist}
                        isRefreshing={isRefreshing}
                        refreshStatus={refreshStatus}
                        onClear={() => setShowClearModal(true)}
                        anyItems={movies.length > 0}
                        addLabel="Add Movie"
                        addLink="./searchmovie"
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                    />
                    {movies.length === 0 && !loading && (
                        <div className="mn-empty-state text-center animate-fade-in mt-4">
                            <div className="display-1 mb-4">🎬</div>
                            <h2 className="fw-bold h1 mb-3">Your Vault is Empty</h2>
                            <p className="text-muted fs-5 mb-4 mx-auto" style={{ maxWidth: '600px' }}>
                                Start building your collection by searching for movies you want to watch or have already seen.
                            </p>
                            <a href="/searchmovie" className="btn btn-premium btn-premium-primary px-5 py-3 shadow-sm rounded-pill fw-bold">
                                Explore Movies
                            </a>
                        </div>
                    )}
                    <div className="list-group list-group-light">
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <li key={i} className="media-card-premium">
                                    {/* Poster skeleton */}
                                    <div className="media-poster-wrapper">
                                        <div className="skeleton-box" style={{ width: '100%', height: '150px', borderRadius: '12px' }}></div>
                                    </div>

                                    {/* Content skeleton */}
                                    <div className="media-content">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div style={{ flex: 1 }}>
                                                {/* Title */}
                                                <div className="skeleton-box mb-2" style={{ width: '70%', height: '24px', borderRadius: '6px' }}></div>
                                                {/* Badges */}
                                                <div className="d-flex gap-2 mb-2">
                                                    <div className="skeleton-box" style={{ width: '50px', height: '20px', borderRadius: '12px' }}></div>
                                                    <div className="skeleton-box" style={{ width: '40px', height: '20px', borderRadius: '12px' }}></div>
                                                </div>
                                            </div>
                                            {/* Watched toggle skeleton */}
                                            <div className="skeleton-box" style={{ width: '32px', height: '32px', borderRadius: '50%' }}></div>
                                        </div>

                                        {/* Metadata line */}
                                        <div className="d-flex gap-3 mb-2">
                                            <div className="skeleton-box" style={{ width: '60px', height: '16px', borderRadius: '4px' }}></div>
                                            <div className="skeleton-box" style={{ width: '80px', height: '16px', borderRadius: '4px' }}></div>
                                        </div>

                                        {/* Genres */}
                                        <div className="skeleton-box mb-2" style={{ width: '85%', height: '14px', borderRadius: '4px' }}></div>

                                        {/* Providers and remove button */}
                                        <div className="d-flex justify-content-between align-items-end mt-2">
                                            <div className="d-flex gap-1">
                                                <div className="skeleton-box" style={{ width: '22px', height: '22px', borderRadius: '50%' }}></div>
                                                <div className="skeleton-box" style={{ width: '22px', height: '22px', borderRadius: '50%' }}></div>
                                                <div className="skeleton-box" style={{ width: '22px', height: '22px', borderRadius: '50%' }}></div>
                                            </div>
                                            <div className="skeleton-box" style={{ width: '70px', height: '24px', borderRadius: '6px' }}></div>
                                        </div>
                                    </div>
                                </li>
                            ))
                        ) : (
                            searchFilteredMovies.map((movie) => (
                                <MediaCard
                                    key={movie.id}
                                    item={movie}
                                    type="movie"
                                    watchSites={watchSites}
                                    selectedProviders={selectedProviders}
                                    getProviderLogo={getProviderLogo}
                                    handleToggleWatched={handleToggleWatched}
                                    handleDeleteClick={handleDeleteClick}
                                    toComponentB={(m) => navigate('/recommendedmovies', { state: m })}
                                    openWatchSite={(n, s) => window.open(`${s.url}${n.replace(/ /g, s.format)}`, '_blank')}
                                    toImdbParentsGuide={(id) => window.open(`https://www.imdb.com/title/${id}/parentalguide`, '_blank')}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>

            <ExportModal show={showExportModal} onHide={() => setShowExportModal(false)} exportText={exportText} listName={listName} />
            <ImportModal show={showImportModal} onHide={() => setShowImportModal(false)} importText={importText} setImportText={setImportText} onImport={handleImportWatchlist} isImporting={isImporting} importStatus={importStatus} listName={listName} type="movies" />
            <RatingModal show={showRatingModal} onHide={() => setShowRatingModal(false)} onSave={handleSaveRating} itemName={movieToRate?.name} type="movie" />
            <ClearWatchlistModal show={showClearModal} onHide={() => setShowClearModal(false)} onConfirm={handleClear} listName={listName} />
            <EditStreamingServices show={showStreamingModal} onHide={() => setShowStreamingModal(false)} availableProviders={availableProviders} selectedProviders={selectedProviders} onSave={handleSaveProviders} />
            <EditWatchSites show={showSitesModal} onHide={() => setShowSitesModal(false)} watchSites={watchSites} onSave={handleSaveSites} />
            <RemoveMediaModal show={showDeleteMovieModal} onHide={() => setShowDeleteMovieModal(false)} onConfirm={handleConfirmDeleteMovie} itemName={movieToDelete?.name} type="movie" />

            {/* Floating Add Button */}
            <a href="./searchmovie" className="floating-add-btn" data-tooltip="Add Movie">
                +
            </a>

            <ScrollControls />
            <Footer />
        </div >
    );
};

export default Movies;
