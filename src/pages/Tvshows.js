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
import RatingModal from "../components/RatingModal";
import ExportModal from "../components/ExportModal";
import ImportModal from "../components/ImportModal";
import MediaFilters from "../components/MediaFilters";

const Tvshows = () => {
    const [searchParams] = useSearchParams();
    const listId = searchParams.get('list');

    const [shows, setShows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uid, setUid] = useState(null);
    const [sortBy, setSortBy] = useState("Default");
    const [listName, setListName] = useState("TV Show Watchlist");

    // Modals
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportText, setExportText] = useState("");
    const [showImportModal, setShowImportModal] = useState(false);
    const [importText, setImportText] = useState("");
    const [importStatus, setImportStatus] = useState("");
    const [isImporting, setIsImporting] = useState(false);
    const [showClearModal, setShowClearModal] = useState(false);
    const [showSitesModal, setShowSitesModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showToDelete, setShowToDelete] = useState(null);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [showToRate, setShowToRate] = useState(null);

    // Settings & Filters
    const [watchSites, setWatchSites] = useState([
        { name: "Lookmovie", url: "https://lookmovie.foundation/shows/search/?q=", format: "%20" },
        { name: "DopeBox", url: "https://dopebox.to/search/", format: "-" }
    ]);
    const [showStreamingModal, setShowStreamingModal] = useState(false);
    const [availableProviders, setAvailableProviders] = useState([]);
    const [selectedProviders, setSelectedProviders] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshStatus, setRefreshStatus] = useState("");
    const [streamingFilter, setStreamingFilter] = useState([]);

    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                const uid = user.uid;
                setUid(uid);
                fetchShows(uid);
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

    const getShowsPath = (uid) => {
        if (listId) {
            return `users/${uid}/customwatchlists/${listId}/items`;
        }
        return `users/${uid}/defaultwatchlists/tvshows/items`;
    };

    const initializeDefaultWatchlist = async (uid) => {
        try {
            const defaultListRef = ref(db, `users/${uid}/defaultwatchlists/tvshows`);
            const snapshot = await get(defaultListRef);
            if (!snapshot.exists() || !snapshot.val().name) {
                await update(defaultListRef, {
                    name: "TV Shows",
                    type: "tvshows",
                    createdAt: Date.now()
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
                : `users/${uid}/defaultwatchlists/tvshows`;
            const listRef = ref(db, listPath);
            const snapshot = await get(listRef);
            if (snapshot.exists()) {
                setListName(snapshot.val().name || (listType === 'custom' ? "Custom Watchlist" : "TV Show Watchlist"));
            } else if (listType === 'default') {
                setListName("TV Show Watchlist");
            }
        } catch (error) {
            console.error('Error fetching list name:', error);
        }
    };

    const fetchShows = async (uid) => {
        try {
            const showsRef = ref(db, getShowsPath(uid));
            const snapshot = await get(showsRef);
            if (snapshot.exists()) {
                const showsData = snapshot.val();
                const showsArray = Object.keys(showsData).map((key) => ({
                    id: key,
                    tvshowid: showsData[key].tvshowid,
                    name: showsData[key].tvshowtitle,
                    watched: showsData[key].watched,
                    providers: showsData[key].providers,
                    agerating: showsData[key].agerating,
                    vote_average: showsData[key].voteaverage,
                    num_episodes: showsData[key].numepisodes,
                    genres: showsData[key].genres,
                    first_air_date: showsData[key].first_air_date,
                    poster_path: showsData[key].poster_path,
                    user_rating: showsData[key].user_rating
                }));
                setShows(showsArray);
            } else {
                setShows([]);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching shows:', error);
            setLoading(false);
        }
    };

    const fetchWatchSites = async (uid) => {
        try {
            const sitesRef = ref(db, `users/${uid}/settings/tvshows/watchsites`);
            const snapshot = await get(sitesRef);
            if (snapshot.exists()) {
                setWatchSites(snapshot.val());
            }
        } catch (error) {
            console.error('Error fetching watch sites:', error);
        }
    };

    const fetchAvailableProviders = async () => {
        try {
            const response = await axios.get(`https://api.themoviedb.org/3/watch/providers/tv`, {
                params: {
                    api_key: process.env.REACT_APP_API_KEY,
                    watch_region: 'US'
                }
            });
            const providers = response.data.results || [];
            providers.sort((a, b) => a.provider_name.localeCompare(b.provider_name));
            setAvailableProviders(providers);
        } catch (error) {
            console.error('Error fetching available providers:', error);
        }
    };

    const fetchSelectedProviders = async (uid) => {
        try {
            const providersRef = ref(db, `users/${uid}/settings/tvshows/streamingservices`);
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

    const handleSortBy = (value) => {
        setSortBy(value);
    };

    const toComponentB = (show) => {
        navigate('/recommendedshows', { state: show });
    };

    const getStreamingFilterButtonText = () => {
        if (streamingFilter.length === 0) return "All";
        if (streamingFilter.length === 1) return `${streamingFilter[0]}`;
        return `${streamingFilter.length} Selected`;
    };

    const handleStreamingFilterToggle = (providerName) => {
        if (streamingFilter.includes(providerName)) {
            setStreamingFilter(streamingFilter.filter(p => p !== providerName));
        } else {
            setStreamingFilter([...streamingFilter, providerName]);
        }
    };

    const handleSelectAllStreaming = () => {
        if (streamingFilter.length === selectedProviders.length) {
            setStreamingFilter([]);
        } else {
            setStreamingFilter(selectedProviders);
        }
    };

    const handleSaveProviders = async (updatedProviders) => {
        try {
            await update(ref(db, `users/${uid}/settings/tvshows`), { streamingservices: updatedProviders });
            setSelectedProviders(updatedProviders);
            setShowStreamingModal(false);
        } catch (error) {
            console.error('Error saving streaming services:', error);
        }
    };

    const handleSaveSites = async (updatedSites) => {
        try {
            await update(ref(db, `users/${uid}/settings/tvshows`), { watchsites: updatedSites });
            setWatchSites(updatedSites);
            setShowSitesModal(false);
        } catch (error) {
            console.error('Error saving watch sites:', error);
        }
    };

    const handleDeleteClick = (show) => {
        setShowToDelete(show);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = () => {
        if (!showToDelete) return;
        const showRef = ref(db, `${getShowsPath(uid)}/${showToDelete.id}`);
        remove(showRef)
            .then(() => {
                setShows(shows.filter(s => s.id !== showToDelete.id));
                setShowDeleteModal(false);
                setShowToDelete(null);
            })
            .catch((error) => {
                console.error('Error removing show:', error);
            });
    };

    const handleToggleWatched = async (show_obj, watched) => {
        if (!watched) {
            setShowToRate(show_obj);
            setShowRatingModal(true);
        } else {
            try {
                const showRef = ref(db, `${getShowsPath(uid)}/${show_obj.id}`);
                await update(showRef, { watched: false, user_rating: null });
                setShows(shows.map(show => {
                    if (show.id === show_obj.id) {
                        return { ...show, watched: false, user_rating: null };
                    }
                    return show;
                }));
            } catch (error) {
                console.error('Error updating watched status:', error);
            }
        }
    };

    const handleSaveRating = async (ratingVal) => {
        if (!showToRate) return;

        try {
            const showRef = ref(db, `${getShowsPath(uid)}/${showToRate.id}`);
            await update(showRef, { watched: true, user_rating: ratingVal });
            setShows(shows.map(show => {
                if (show.id === showToRate.id) {
                    return { ...show, watched: true, user_rating: ratingVal };
                }
                return show;
            }));
            setShowRatingModal(false);
            setShowToRate(null);
        } catch (error) {
            console.error('Error saving rating:', error);
        }
    };


    const openWatchSite = (name, site) => {
        const formattedName = name.replace(/ /g, site.format);
        window.open(`${site.url}${formattedName}`, '_blank');
    };

    const handleRefreshWatchlist = async () => {
        if (shows.length === 0) return;
        setIsRefreshing(true);
        for (let i = 0; i < shows.length; i++) {
            const show = shows[i];
            setRefreshStatus(`Updating ${i + 1}/${shows.length}: ${show.name}`);
            try {
                // Fetch latest TV show details
                const detailsResponse = await axios.get(`https://api.themoviedb.org/3/tv/${show.tvshowid}`, {
                    params: { api_key: process.env.REACT_APP_API_KEY }
                });
                const showDetails = detailsResponse.data;
                const genreString = showDetails.genres.map(g => g.name).join(' • ');

                // Get latest age rating
                const ratingResponse = await axios.get(`https://api.themoviedb.org/3/tv/${show.tvshowid}/content_ratings`, {
                    params: { api_key: process.env.REACT_APP_API_KEY }
                });
                let certification = null;
                const usRating = ratingResponse.data.results.find(r => r.iso_3166_1 === "US");
                if (usRating) certification = usRating.rating;

                // Get latest streaming providers
                const providersResponse = await axios.get(`https://api.themoviedb.org/3/tv/${show.tvshowid}/watch/providers`, {
                    params: { api_key: process.env.REACT_APP_API_KEY }
                });
                let providerNames = [];
                if (providersResponse.data.results.US && providersResponse.data.results.US.flatrate) {
                    providerNames = providersResponse.data.results.US.flatrate.map(p => p.provider_name);
                }

                // Update in database
                const showRef = ref(db, `${getShowsPath(uid)}/${show.id}`);
                await update(showRef, {
                    tvshowtitle: showDetails.name,
                    numepisodes: showDetails.number_of_episodes,
                    providers: providerNames,
                    agerating: certification,
                    voteaverage: showDetails.vote_average,
                    genres: genreString,
                    first_air_date: showDetails.first_air_date,
                    poster_path: showDetails.poster_path || ""
                });
            } catch (error) {
                console.error(`Error refreshing "${show.name}":`, error);
            }
        }
        setRefreshStatus("Done! Refreshing list...");
        await fetchShows(uid);
        setIsRefreshing(false);
        setRefreshStatus("");
    };

    const exportWatchlist = () => {
        const lines = shows.map(show => {
            const year = show.first_air_date ? ` (${show.first_air_date.substring(0, 4)})` : "";
            const watchedStatus = show.watched ? " [x]" : " []";
            const rating = (show.watched && show.user_rating) ? ` {${show.user_rating}}` : "";
            return `${show.name}${year}${watchedStatus}${rating}`;
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
        const existingShowIds = shows.map(s => s.tvshowid);
        let added = 0; let skipped = 0; let notFound = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            setImportStatus(`Processing ${i + 1}/${lines.length}: ${line}`);
            const match = line.match(/^(.+?)\s*(?:\((\d{4})\))?\s*(?:\[(x?)\])?\s*(?:\{([\d.]+)\})?$/);
            if (!match) continue;

            const title = match[1].trim();
            const year = match[2];
            const isWatched = match[3] === 'x';
            const rating = match[4] ? parseFloat(match[4]) : null;

            try {
                const searchRes = await axios.get(`https://api.themoviedb.org/3/search/tv`, {
                    params: { api_key: process.env.REACT_APP_API_KEY, query: title, first_air_date_year: year || undefined }
                });
                if (searchRes.data.results.length === 0) { notFound++; continue; }
                const show = searchRes.data.results[0];
                if (existingShowIds.includes(show.id)) { skipped++; continue; }

                const detailsRes = await axios.get(`https://api.themoviedb.org/3/tv/${show.id}`, {
                    params: { api_key: process.env.REACT_APP_API_KEY }
                });
                const showDetails = detailsRes.data;
                const genreString = showDetails.genres.map(g => g.name).join(' • ');

                const ratingsRes = await axios.get(`https://api.themoviedb.org/3/tv/${show.id}/content_ratings`, {
                    params: { api_key: process.env.REACT_APP_API_KEY }
                });
                const usRating = ratingsRes.data.results.find(r => r.iso_3166_1 === "US");

                const providersRes = await axios.get(`https://api.themoviedb.org/3/tv/${show.id}/watch/providers`, {
                    params: { api_key: process.env.REACT_APP_API_KEY }
                });
                let providerNames = [];
                if (providersRes.data.results.US && providersRes.data.results.US.flatrate) {
                    providerNames = providersRes.data.results.US.flatrate.map(p => p.provider_name);
                }

                await push(ref(db, getShowsPath(uid)), {
                    tvshowtitle: showDetails.name,
                    tvshowid: showDetails.id,
                    watched: isWatched,
                    numepisodes: showDetails.number_of_episodes,
                    providers: providerNames,
                    agerating: usRating ? usRating.rating : null,
                    voteaverage: show.vote_average,
                    genres: genreString,
                    first_air_date: showDetails.first_air_date,
                    poster_path: show.poster_path,
                    user_rating: rating
                });
                existingShowIds.push(show.id);
                added++;
            } catch (error) {
                console.error(`Error importing "${line}":`, error);
                notFound++;
            }
        }
        setImportStatus(`Done! Added: ${added}, Skipped: ${skipped}, Not Found: ${notFound}`);
        fetchShows(uid);
        setIsImporting(false);
    };

    const handleClearWatchlist = () => {
        remove(ref(db, getShowsPath(uid)))
            .then(() => {
                setShows([]);
                setShowClearModal(false);
            })
            .catch(err => console.error("Error clearing watchlist:", err));
    };

    const filteredShows = useMemo(() => {
        let result = shows;
        if (streamingFilter.length > 0) {
            result = result.filter(show =>
                show.providers && show.providers.length > 0 &&
                streamingFilter.some(provider => show.providers.includes(provider))
            );
        }

        const sorted = [...result];
        if (sortBy === "To Watch") {
            sorted.sort((a, b) => a.watched - b.watched);
        } else if (sortBy === "Watched") {
            sorted.sort((a, b) => b.watched - a.watched);
        } else if (sortBy === "Episodes") {
            sorted.sort((a, b) => (b.num_episodes || 0) - (a.num_episodes || 0));
        } else if (sortBy === "User Rating") {
            sorted.sort((a, b) => (b.user_rating || -1) - (a.user_rating || -1));
        } else if (sortBy === "Release Year") {
            sorted.sort((a, b) => {
                const yearA = parseInt(a.first_air_date) || 9999;
                const yearB = parseInt(b.first_air_date) || 9999;
                return yearA - yearB;
            });
        }
        return sorted;
    }, [shows, streamingFilter, sortBy]);

    return (
        <div className="">
            <style>{`
                .hover-overlay:hover { opacity: 1 !important; }
                .poster-dropdown::before, .poster-dropdown::after { display: none !important; }
                @keyframes skeleton-loading { 0% { background-color: #f0f0f0; } 50% { background-color: #e0e0e0; } 100% { background-color: #f0f0f0; } }
                .skeleton-box { animation: skeleton-loading 1.5s infinite ease-in-out; background-color: #f0f0f0; }
                .fade-in { animation: fadeIn 0.5s ease-in; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
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

                        <MediaFilters
                            sortBy={sortBy}
                            onSortChange={handleSortBy}
                            sortOptions={["Default", "To Watch", "Watched", "Episodes", "User Rating", "Release Year"]}
                            streamingFilter={streamingFilter}
                            selectedProviders={selectedProviders}
                            onSelectAllStreaming={handleSelectAllStreaming}
                            onStreamingFilterToggle={handleStreamingFilterToggle}
                            streamingFilterButtonText={getStreamingFilterButtonText()}
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
                        />

                        <div className="list-group list-group-light">
                            {loading ? (
                                Array(5).fill(0).map((_, idx) => (
                                    <div key={idx} className="list-group-item rounded mb-2 mt-2 shadow-sm p-3 bg-white d-flex align-items-start">
                                        <div className="skeleton-box rounded flex-shrink-0" style={{ width: '100px', height: '150px' }}></div>
                                        <div className="flex-grow-1 ms-3" style={{ minWidth: 0 }}>
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <div className="skeleton-box rounded" style={{ width: '60%', height: '28px' }}></div>
                                                <div className="skeleton-box rounded" style={{ width: '24px', height: '24px' }}></div>
                                            </div>
                                            <div className="skeleton-box rounded mb-2" style={{ width: '40%', height: '20px' }}></div>
                                            <div className="skeleton-box rounded" style={{ width: '50%', height: '18px' }}></div>
                                        </div>
                                    </div>
                                ))
                            ) : filteredShows.length === 0 ? (
                                <div className="text-center p-5 bg-white rounded shadow-sm border mt-3">
                                    <p className="text-muted mb-0">Your TV show watchlist is empty or no shows match your filters.</p>
                                </div>
                            ) : (
                                filteredShows.map((show) => (
                                    <MediaCard
                                        key={show.id}
                                        item={show}
                                        type="tv"
                                        watchSites={watchSites}
                                        selectedProviders={selectedProviders}
                                        getProviderLogo={getProviderLogo}
                                        handleToggleWatched={handleToggleWatched}
                                        handleDeleteClick={handleDeleteClick}
                                        toComponentB={toComponentB}
                                        openWatchSite={openWatchSite}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals mirror Movies.js */}
            <RemoveMediaModal
                show={showDeleteModal}
                onHide={() => setShowDeleteModal(false)}
                onConfirm={handleConfirmDelete}
                itemName={showToDelete?.name}
                type="tv"
            />

            <RatingModal
                show={showRatingModal}
                onHide={() => setShowRatingModal(false)}
                onSave={handleSaveRating}
                itemName={showToRate?.name}
                type="tv"
            />

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

            <ImportModal
                show={showImportModal}
                onHide={() => setShowImportModal(false)}
                importText={importText}
                setImportText={setImportText}
                onImport={handleImportWatchlist}
                isImporting={isImporting}
                importStatus={importStatus}
                listName={listName}
                type="tv"
            />

            <ExportModal
                show={showExportModal}
                onHide={() => setShowExportModal(false)}
                exportText={exportText}
                listName={listName}
            />

            <Footer />
        </div >
    );
};

export default Tvshows;