import { useState } from "react";
import { useNavigate, useSearchParams } from 'react-router-dom';
import Footer from "./Footer";
import MediaCard from "../components/MediaCard";
import RatingModal from "../components/RatingModal";
import ExportModal from "../components/ExportModal";
import ImportModal from "../components/ImportModal";
import ClearVaultModal from "../components/ClearVaultModal";
import RemoveMediaModal from "../components/RemoveMediaModal";
import MediaFilters from "../components/MediaFilters";
import EditWatchSites from "../components/EditWatchSites";
import EditStreamingServices from "../components/EditStreamingServices";
import ScrollControls from "../components/ScrollControls";
import useVault from "../hooks/useVault";
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
    } = useVault('movie', listId);

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

    const handleRefreshVault = async () => {
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
        refreshData(true);
    };

    const exportVault = () => {
        const content = movies.map(m => `${m.name}${m.releaseyear ? ` (${m.releaseyear})` : ""} ${m.watched ? "[x]" : "[]"}${m.user_rating ? ` {${m.user_rating}}` : ""}`).join("\n");
        setExportText(content);
        setShowExportModal(true);
    };

    const handleImportVault = async () => {
        if (!importText.trim()) return;
        setIsImporting(true);
        setImportStatus("Importing...");
        const lines = importText.split("\n").filter(l => l.trim());
        const existingIds = movies.map(m => m.movieid);
        let addedCount = 0;
        let skippedCount = 0;

        for (const line of lines) {
            const match = line.match(/^(.+?)\s*(?:\((\d{4})\))?\s*(?:\[(x?)\])?\s*(?:\{([\d.]+)\})?$/);
            if (!match) continue;
            const [, title, year, watched, rating] = match;

            try {
                const searchRes = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
                    params: { api_key: process.env.REACT_APP_API_KEY, query: title, year }
                });
                const movie = searchRes.data.results[0];
                if (!movie) continue;

                if (existingIds.includes(movie.id)) {
                    skippedCount++;
                    continue;
                }

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
                addedCount++;
            } catch (e) { console.error(e); }
        }
        setIsImporting(false);
        setImportStatus(`Done! Added: ${addedCount}, Skipped (Already in Vault): ${skippedCount}`);
        refreshData(true);
    };

    return (
        <div className="fade-in">

            <div className="search-hero">
                <div className="container">
                    <h1 className={`search-title-premium ${loading ? 'opacity-0' : 'animate-fade-in'}`}>
                        {listName || "Movie Vault"}
                    </h1>
                    <p className={`text-muted fs-5 ${loading ? 'opacity-0' : 'animate-slide-up'}`}>
                        Manage and explore your cinematic collection.
                    </p>
                </div>
            </div>

            {!loading && (
                <div className="container pb-5 px-5">
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
                            onExport={exportVault}
                            onEditProviders={() => setShowStreamingModal(true)}
                            onEditSites={() => setShowSitesModal(true)}
                            onRefresh={handleRefreshVault}
                            isRefreshing={isRefreshing}
                            refreshStatus={refreshStatus}
                            onClear={() => setShowClearModal(true)}
                            anyItems={movies.length > 0}
                            addLabel="Add Movie"
                            addLink="./searchmovie"
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                        />
                        {movies.length === 0 && (
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
                            {searchFilteredMovies.map((movie, index) => (
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
                                    index={index}
                                />
                            ))}
                        </div>
                    </div>

                    <ExportModal show={showExportModal} onHide={() => setShowExportModal(false)} exportText={exportText} listName={listName} />
                    <ImportModal show={showImportModal} onHide={() => setShowImportModal(false)} importText={importText} setImportText={setImportText} onImport={handleImportVault} isImporting={isImporting} importStatus={importStatus} listName={listName} type="movies" />
                    <RatingModal show={showRatingModal} onHide={() => setShowRatingModal(false)} onSave={handleSaveRating} itemName={movieToRate?.name} type="movie" />
                    <ClearVaultModal show={showClearModal} onHide={() => setShowClearModal(false)} onConfirm={handleClear} listName={listName} />
                    <EditStreamingServices show={showStreamingModal} onHide={() => setShowStreamingModal(false)} availableProviders={availableProviders} selectedProviders={selectedProviders} onSave={handleSaveProviders} />
                    <EditWatchSites show={showSitesModal} onHide={() => setShowSitesModal(false)} watchSites={watchSites} onSave={handleSaveSites} />
                    <RemoveMediaModal show={showDeleteMovieModal} onHide={() => setShowDeleteMovieModal(false)} onConfirm={handleConfirmDeleteMovie} itemName={movieToDelete?.name} type="movie" />

                    {/* Floating Add Button */}
                    <a href="./searchmovie" className="floating-add-btn" data-tooltip="Add Movie">
                        +
                    </a>

                    <ScrollControls />
                    <Footer />
                </div>
            )}
        </div>
    );
};

export default Movies;
