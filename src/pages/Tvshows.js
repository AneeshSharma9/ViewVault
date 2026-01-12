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

const Tvshows = () => {
    const [searchParams] = useSearchParams();
    const listId = searchParams.get('list');
    const navigate = useNavigate();

    const {
        items: shows,
        filteredItems: filteredShows,
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
    } = useWatchlist('tv', listId);

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
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showToDelete, setShowToDelete] = useState(null);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [showToRate, setShowToRate] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter shows by search query
    const searchFilteredShows = searchQuery.trim()
        ? filteredShows.filter(show =>
            show.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : filteredShows;

    const getProviderLogo = (providerName) => {
        const provider = availableProviders.find(p => p.provider_name === providerName);
        return provider?.logo_path ? `https://image.tmdb.org/t/p/w45${provider.logo_path}` : null;
    };

    const handleToggleWatched = (show, watched) => {
        if (!watched) {
            setShowToRate(show);
            setShowRatingModal(true);
        } else {
            baseToggleWatched(show, true);
        }
    };

    const handleSaveRating = async (ratingVal) => {
        if (!showToRate) return;
        await baseToggleWatched(showToRate, false, ratingVal);
        setShowRatingModal(false);
        setShowToRate(null);
    };

    const handleDeleteClick = (show) => {
        setShowToDelete(show);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (showToDelete) {
            await handleDelete(showToDelete.id);
            setShowDeleteModal(false);
            setShowToDelete(null);
        }
    };

    const handleRefreshWatchlist = async () => {
        if (shows.length === 0 || isRefreshing) return;
        setIsRefreshing(true);
        setRefreshStatus("Starting refresh...");

        for (let i = 0; i < shows.length; i++) {
            const show = shows[i];
            setRefreshStatus(`Refreshing ${i + 1}/${shows.length}: ${show.name}`);
            try {
                const detailsRes = await axios.get(`https://api.themoviedb.org/3/tv/${show.tvshowid}`, {
                    params: { api_key: process.env.REACT_APP_API_KEY }
                });
                const showDetails = detailsRes.data;

                const ratingRes = await axios.get(`https://api.themoviedb.org/3/tv/${show.tvshowid}/content_ratings`, {
                    params: { api_key: process.env.REACT_APP_API_KEY }
                });
                let certification = null;
                const usRating = ratingRes.data.results.find(r => r.iso_3166_1 === "US");
                if (usRating) certification = usRating.rating;

                const providersRes = await axios.get(`https://api.themoviedb.org/3/tv/${show.tvshowid}/watch/providers`, {
                    params: { api_key: process.env.REACT_APP_API_KEY }
                });
                let providerNames = [];
                if (providersRes.data.results.US?.flatrate) {
                    providerNames = providersRes.data.results.US.flatrate.map(p => p.provider_name);
                }

                const showRef = ref(db, `${listId ? `users/${uid}/customwatchlists/${listId}` : `users/${uid}/defaultwatchlists/tvshows`}/items/${show.id}`);
                await update(showRef, {
                    tvshowtitle: showDetails.name,
                    numepisodes: showDetails.number_of_episodes,
                    providers: providerNames,
                    agerating: certification,
                    voteaverage: showDetails.vote_average,
                    genres: showDetails.genres.map(g => g.name).join(' • '),
                    first_air_date: showDetails.first_air_date,
                    poster_path: showDetails.poster_path
                });
            } catch (error) {
                console.error(`Error refreshing "${show.name}":`, error);
            }
        }
        setRefreshStatus("");
        setIsRefreshing(false);
        refreshData();
    };

    const exportWatchlist = () => {
        const content = shows.map(s => `${s.name}${s.first_air_date ? ` (${s.first_air_date.substring(0, 4)})` : ""} ${s.watched ? "[x]" : "[]"}${s.user_rating ? ` {${s.user_rating}}` : ""}`).join("\n");
        setExportText(content);
        setShowExportModal(true);
    };

    const handleImportWatchlist = async () => {
        if (!importText.trim()) return;
        setIsImporting(true);
        setImportStatus("Importing...");
        const lines = importText.split("\n").filter(l => l.trim());
        const existingIds = shows.map(s => s.tvshowid);

        for (const line of lines) {
            const match = line.match(/^(.+?)\s*(?:\((\d{4})\))?\s*(?:\[(x?)\])?\s*(?:\{([\d.]+)\})?$/);
            if (!match) continue;
            const [, title, year, watched, rating] = match;

            try {
                const searchRes = await axios.get(`https://api.themoviedb.org/3/search/tv`, {
                    params: { api_key: process.env.REACT_APP_API_KEY, query: title, first_air_date_year: year }
                });
                const show = searchRes.data.results[0];
                if (!show || existingIds.includes(show.id)) continue;

                const detailsRes = await axios.get(`https://api.themoviedb.org/3/tv/${show.id}`, {
                    params: { api_key: process.env.REACT_APP_API_KEY }
                });
                const ratingsRes = await axios.get(`https://api.themoviedb.org/3/tv/${show.id}/content_ratings`, {
                    params: { api_key: process.env.REACT_APP_API_KEY }
                });
                const providersRes = await axios.get(`https://api.themoviedb.org/3/tv/${show.id}/watch/providers`, {
                    params: { api_key: process.env.REACT_APP_API_KEY }
                });

                const showRef = ref(db, `${listId ? `users/${uid}/customwatchlists/${listId}` : `users/${uid}/defaultwatchlists/tvshows`}/items`);
                await push(showRef, {
                    tvshowtitle: detailsRes.data.name,
                    tvshowid: show.id,
                    watched: !!watched,
                    numepisodes: detailsRes.data.number_of_episodes,
                    providers: providersRes.data.results.US?.flatrate?.map(p => p.provider_name) || [],
                    agerating: ratingsRes.data.results.find(r => r.iso_3166_1 === "US")?.rating || null,
                    voteaverage: show.vote_average,
                    genres: detailsRes.data.genres.map(g => g.name).join(' • '),
                    first_air_date: detailsRes.data.first_air_date,
                    poster_path: show.poster_path,
                    user_rating: rating ? parseFloat(rating) : null
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
                    <h1 className={`search-title-premium ${loading ? 'opacity-0' : 'animate-fade-in'}`}>
                        {listName || "TV Show Vault"}
                    </h1>
                    <p className={`text-muted fs-5 ${loading ? 'opacity-0' : 'animate-slide-up'}`}>
                        Track your progress and discover your next binge.
                    </p>
                </div>
            </div>

            {!loading && (
                <div className="container pb-5">
                    <div className="pb-4">
                        <MediaFilters
                            sortBy={sortBy}
                            onSortChange={handleSortBy}
                            sortOptions={["Default", "To Watch", "Watched", "Episodes", "User Rating", "Release Year"]}
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
                            anyItems={shows.length > 0}
                            addLabel="Add TV Show"
                            addLink="./searchtv"
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                        />

                        {shows.length === 0 && (
                            <div className="mn-empty-state text-center animate-fade-in mt-4">
                                <div className="display-1 mb-4">📺</div>
                                <h2 className="fw-bold h1 mb-3">Your Vault is Empty</h2>
                                <p className="text-muted fs-5 mb-4 mx-auto" style={{ maxWidth: '600px' }}>
                                    Start building your collection by searching for TV shows you want to watch or have already finished.
                                </p>
                                <a href="/searchtv" className="btn btn-premium btn-premium-primary px-5 py-3 shadow-sm rounded-pill fw-bold">
                                    Explore TV Shows
                                </a>
                            </div>
                        )}
                        <div className="list-group list-group-light">
                            {searchFilteredShows.map((show, index) => (
                                <MediaCard
                                    key={show.id}
                                    item={show}
                                    type="tv"
                                    watchSites={watchSites}
                                    selectedProviders={selectedProviders}
                                    getProviderLogo={getProviderLogo}
                                    handleToggleWatched={handleToggleWatched}
                                    handleDeleteClick={handleDeleteClick}
                                    toComponentB={(s) => navigate('/recommendedshows', { state: s })}
                                    openWatchSite={(n, s) => window.open(`${s.url}${n.replace(/ /g, s.format)}`, '_blank')}
                                    index={index}
                                />
                            ))}
                        </div>
                    </div>

                    <ExportModal show={showExportModal} onHide={() => setShowExportModal(false)} exportText={exportText} listName={listName} />
                    <ImportModal show={showImportModal} onHide={() => setShowImportModal(false)} importText={importText} setImportText={setImportText} onImport={handleImportWatchlist} isImporting={isImporting} importStatus={importStatus} listName={listName} type="tv" />
                    <RatingModal show={showRatingModal} onHide={() => setShowRatingModal(false)} onSave={handleSaveRating} itemName={showToRate?.name} type="tv" />
                    <ClearWatchlistModal show={showClearModal} onHide={() => setShowClearModal(false)} onConfirm={handleClear} listName={listName} />
                    <EditStreamingServices show={showStreamingModal} onHide={() => setShowStreamingModal(false)} availableProviders={availableProviders} selectedProviders={selectedProviders} onSave={handleSaveProviders} />
                    <EditWatchSites show={showSitesModal} onHide={() => setShowSitesModal(false)} watchSites={watchSites} onSave={handleSaveSites} />
                    <RemoveMediaModal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} onConfirm={handleConfirmDelete} itemName={showToDelete?.name} type="tv" />

                    {/* Floating Add Button */}
                    <a href="./searchtv" className="floating-add-btn" data-tooltip="Add TV Show">
                        +
                    </a>

                    <ScrollControls />
                    <Footer />
                </div>
            )}
        </div>
    );
};

export default Tvshows;