import { useState, useEffect, useMemo } from "react";
import Navbar from "./Navbar";
import { auth, db } from "../utils/firebase"
import { ref, get, remove, update, push } from "firebase/database";
import { useNavigate, useSearchParams } from 'react-router-dom';
import Footer from "./Footer";
import axios from "axios";
import EditWatchSites from "../components/EditWatchSites";

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
    const [ratingInput, setRatingInput] = useState("");
    const [showToRate, setShowToRate] = useState(null);

    // Settings & Filters
    const [watchSites, setWatchSites] = useState([
        { name: "Lookmovie", url: "https://lookmovie.foundation/shows/search/?q=", format: "%20" },
        { name: "DopeBox", url: "https://dopebox.to/search/", format: "-" }
    ]);
    const [showStreamingModal, setShowStreamingModal] = useState(false);
    const [availableProviders, setAvailableProviders] = useState([]);
    const [selectedProviders, setSelectedProviders] = useState([]);
    const [editingProviders, setEditingProviders] = useState([]);
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
        if (streamingFilter.length === 0) return "Streaming: All";
        if (streamingFilter.length === 1) return `Streaming: ${streamingFilter[0]}`;
        return `Streaming: ${streamingFilter.length} Selected`;
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

    const openStreamingModal = () => {
        setEditingProviders(selectedProviders);
        setShowStreamingModal(true);
    };

    const toggleEditingProvider = (providerName) => {
        if (editingProviders.includes(providerName)) {
            setEditingProviders(editingProviders.filter(p => p !== providerName));
        } else {
            setEditingProviders([...editingProviders, providerName]);
        }
    };

    const handleSaveProviders = async () => {
        try {
            await update(ref(db, `users/${uid}/settings/tvshows`), { streamingservices: editingProviders });
            setSelectedProviders(editingProviders);
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
            setRatingInput("");
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

    const handleSaveRating = async () => {
        if (!showToRate) return;
        let ratingVal = parseFloat(ratingInput);
        if (isNaN(ratingVal) || ratingVal < 0) ratingVal = 0;
        if (ratingVal > 10) ratingVal = 10;
        ratingVal = Math.round(ratingVal * 10) / 10;

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

    const getTextColorClass = (voteAverage) => {
        if (voteAverage * 10 >= 70) return "text-success";
        if (voteAverage * 10 >= 50) return "text-warning";
        return "text-danger";
    };

    const getAgeRatingClass = (rating) => {
        if (!rating) return "bg-secondary";
        const r = rating.toUpperCase();
        if (["G", "TV-G", "TV-Y"].includes(r)) return "bg-success";
        if (["PG", "TV-PG", "TV-Y7"].includes(r)) return "bg-primary";
        if (["PG-13", "TV-14"].includes(r)) return "bg-warning text-dark";
        if (["R", "NC-17", "TV-MA"].includes(r)) return "bg-danger";
        return "bg-secondary";
    };

    const convertMinToHrMin = (mins) => {
        if (!mins) return "N/A";
        const hours = Math.floor(mins / 60);
        const minutes = mins % 60;
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
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

                        <div className="pt-2 pb-4">
                            <div className="mb-3 d-flex flex-column flex-md-row justify-content-between gap-3">
                                <div className="d-flex gap-2 flex-wrap">
                                    <button className="btn btn-outline-secondary dropdown-toggle flex-fill" type="button" data-bs-toggle="dropdown">
                                        {sortBy}
                                    </button>
                                    <ul className="dropdown-menu dropdown-menu-dark">
                                        <li><button className="dropdown-item" onClick={() => handleSortBy("Default")}>Default</button></li>
                                        <li><button className="dropdown-item" onClick={() => handleSortBy("To Watch")}>To Watch</button></li>
                                        <li><button className="dropdown-item" onClick={() => handleSortBy("Watched")}>Watched</button></li>
                                        <li><button className="dropdown-item" onClick={() => handleSortBy("Episodes")}>Episodes (High to Low)</button></li>
                                        <li><button className="dropdown-item" onClick={() => handleSortBy("User Rating")}>User Rating</button></li>
                                        <li><button className="dropdown-item" onClick={() => handleSortBy("Release Year")}>Release Year</button></li>
                                    </ul>

                                    <button className="btn btn-outline-secondary dropdown-toggle flex-fill" type="button" data-bs-toggle="dropdown">
                                        {getStreamingFilterButtonText()}
                                    </button>
                                    <ul className="dropdown-menu dropdown-menu-dark" style={{ minWidth: '200px', maxHeight: '300px', overflowY: 'auto' }}>
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
                                        {selectedProviders.map((provider) => (
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
                                        ))}
                                    </ul>

                                    <div className="dropdown flex-fill">
                                        <button className="btn btn-outline-secondary dropdown-toggle w-100" type="button" data-bs-toggle="dropdown">
                                            ⋯
                                        </button>
                                        <ul className="dropdown-menu dropdown-menu-end">
                                            <li><button className="dropdown-item" onClick={() => { setShowImportModal(true); setImportText(""); setImportStatus(""); }}>Import Watchlist</button></li>
                                            <li><button className="dropdown-item" onClick={exportWatchlist}>Export Watchlist</button></li>
                                            <li><hr className="dropdown-divider" /></li>
                                            <li><button className="dropdown-item" onClick={openStreamingModal}>Edit Streaming Services</button></li>
                                            <li><button className="dropdown-item" onClick={() => setShowSitesModal(true)}>Edit Watch Sites</button></li>
                                            <li><hr className="dropdown-divider" /></li>
                                            <li>
                                                <button className="dropdown-item" onClick={handleRefreshWatchlist} disabled={isRefreshing || shows.length === 0}>
                                                    {isRefreshing ? refreshStatus : "Refresh Watchlist"}
                                                </button>
                                            </li>
                                            <li><button className="dropdown-item text-danger" onClick={() => setShowClearModal(true)}>Clear Watchlist</button></li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="d-flex gap-2 flex-wrap">
                                    <a className="btn btn-primary flex-fill" href="./searchtv">Add TV Show</a>
                                </div>
                            </div>

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
                                        <li key={show.id} className="list-group-item rounded mb-2 mt-2 shadow-sm p-3 bg-white d-flex align-items-start fade-in border-0">
                                            {/* Poster Column */}
                                            <div className="flex-shrink-0" style={{ width: '100px' }}>
                                                {show.poster_path ? (
                                                    <div className="btn-group dropstart w-100">
                                                        <button type="button" className="btn p-0 border-0 w-100 position-relative" data-bs-toggle="dropdown" style={{ overflow: 'hidden' }}>
                                                            <img
                                                                src={`https://image.tmdb.org/t/p/w185${show.poster_path}`}
                                                                alt={show.name}
                                                                className="rounded w-100 shadow-sm"
                                                                style={{ height: '150px', objectFit: 'cover' }}
                                                            />
                                                            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center opacity-0 hover-overlay" style={{ background: 'rgba(0,0,0,0.3)', transition: 'opacity 0.2s' }}>
                                                                <span className="text-white">⋮</span>
                                                            </div>
                                                        </button>
                                                        <ul className="dropdown-menu shadow">
                                                            <li><button className="dropdown-item" onClick={() => toComponentB(show)}>More like this</button></li>
                                                            {watchSites.map((site, idx) => (
                                                                <li key={idx}><button className="dropdown-item" onClick={() => openWatchSite(show.name, site)}>Stream on {site.name}</button></li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                ) : (
                                                    <div className="bg-light rounded d-flex align-items-center justify-content-center text-muted border" style={{ width: '100px', height: '150px' }}>
                                                        <span className="small">No Poster</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content Column */}
                                            <div className="flex-grow-1 ms-3" style={{ minWidth: 0 }}>
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <div>
                                                        <h5 className="mb-0 fw-bold" style={{ fontSize: '1.2rem', lineHeight: '1.2' }}>{show.name}</h5>
                                                        <div className="d-flex align-items-center gap-2 mt-1">
                                                            <small className="text-muted" style={{ fontSize: '0.9rem' }}>({show.first_air_date ? show.first_air_date.substring(0, 4) : "N/A"})</small>
                                                            <span className={`badge border ${getAgeRatingClass(show.agerating || "N/A")}`} style={{ fontSize: '0.75rem' }}>{show.agerating || "N/A"}</span>
                                                        </div>
                                                    </div>
                                                    <div className="form-check ms-2">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            checked={show.watched}
                                                            onChange={() => handleToggleWatched(show, show.watched)}
                                                            style={{ cursor: 'pointer', width: '1.4em', height: '1.4em' }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="d-flex flex-wrap align-items-center gap-2 mt-2 mb-2" style={{ fontSize: '0.95rem' }}>
                                                    {show.watched && show.user_rating && (
                                                        <span className="text-warning fw-bold">⭐ {show.user_rating}</span>
                                                    )}
                                                    {show.vote_average > 0 && (
                                                        <span className={`${getTextColorClass(show.vote_average)} fw-bold`}>
                                                            {(show.vote_average * 10).toFixed(2)}%
                                                        </span>
                                                    )}
                                                    <span className="text-muted">📺 {show.num_episodes} Episodes</span>
                                                </div>

                                                <div className="mb-2" style={{ fontSize: '0.95rem' }}>
                                                    <span className="text-muted">{show.genres || "No genres available"}</span>
                                                </div>

                                                {/* Providers (Compact) */}
                                                {show.providers && show.providers.length > 0 && (() => {
                                                    const filteredProviders = selectedProviders.length > 0
                                                        ? show.providers.filter(p => selectedProviders.includes(p))
                                                        : show.providers;
                                                    return filteredProviders.length > 0 && (
                                                        <div className="d-flex flex-wrap gap-1 mt-2">
                                                            {filteredProviders.slice(0, 5).map((provider, idx) => {
                                                                const logo = getProviderLogo(provider);
                                                                return logo ? (
                                                                    <img key={idx} src={logo} alt={provider} title={provider} className="rounded" style={{ width: '20px', height: '20px' }} />
                                                                ) : (
                                                                    <span key={idx} className="badge bg-light text-dark border p-1" style={{ fontSize: '0.7rem' }}>{provider}</span>
                                                                );
                                                            })}
                                                            {filteredProviders.length > 5 && <span className="small text-muted">+{filteredProviders.length - 5}</span>}
                                                        </div>
                                                    );
                                                })()}

                                                <div className="d-flex justify-content-end mt-2">
                                                    <button className="btn btn-sm btn-link text-danger text-decoration-none p-0" onClick={() => handleDeleteClick(show)} style={{ fontSize: '0.9rem' }}>
                                                        [ Remove ]
                                                    </button>
                                                </div>
                                            </div>
                                        </li>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals mirror Movies.js */}
            {showDeleteModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold">Remove Show</h5>
                                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
                            </div>
                            <div className="modal-body py-4">
                                Are you sure you want to remove <strong>{showToDelete?.name}</strong> from your watchlist?
                            </div>
                            <div className="modal-footer border-0 pt-0">
                                <button className="btn btn-light" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                                <button className="btn btn-danger px-4" onClick={handleConfirmDelete}>Remove</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showRatingModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold">Rate this Show</h5>
                                <button type="button" className="btn-close" onClick={() => setShowRatingModal(false)}></button>
                            </div>
                            <div className="modal-body py-4">
                                <p className="mb-3 text-muted">How would you rate <strong>{showToRate?.name}</strong>?</p>
                                <div className="input-group">
                                    <input type="number" className="form-control form-control-lg text-center fw-bold" placeholder="0.0 - 10" step="0.1" min="0" max="10" value={ratingInput} onChange={(e) => setRatingInput(e.target.value)} autoFocus />
                                    <span className="input-group-text bg-warning text-dark border-0">/ 10</span>
                                </div>
                            </div>
                            <div className="modal-footer border-0 pt-0">
                                <button className="btn btn-light" onClick={() => setShowRatingModal(false)}>Cancel</button>
                                <button className="btn btn-primary px-4" onClick={handleSaveRating}>Save & Mark Watched</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showClearModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold text-danger">Clear Watchlist</h5>
                                <button type="button" className="btn-close" onClick={() => setShowClearModal(false)}></button>
                            </div>
                            <div className="modal-body py-4">Are you sure you want to permanently clear your entire TV show watchlist? This action cannot be undone.</div>
                            <div className="modal-footer border-0 pt-0">
                                <button className="btn btn-light" onClick={() => setShowClearModal(false)}>Cancel</button>
                                <button className="btn btn-danger px-4" onClick={handleClearWatchlist}>Clear All</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showStreamingModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Edit Streaming Services</h5>
                                <button type="button" className="btn-close" onClick={() => setShowStreamingModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="row g-2 overflow-auto" style={{ maxHeight: '400px' }}>
                                    {availableProviders.map((provider) => (
                                        <div key={provider.provider_id} className="col-6 col-md-4 col-lg-3">
                                            <div className={`p-2 border rounded d-flex align-items-center gap-2 ${editingProviders.includes(provider.provider_name) ? 'bg-primary text-white border-primary' : 'bg-light'}`} style={{ cursor: 'pointer' }} onClick={() => toggleEditingProvider(provider.provider_name)}>
                                                {provider.logo_path && <img src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`} style={{ width: '20px', height: '20px' }} className="rounded" alt="" />}
                                                <span className="small text-truncate">{provider.provider_name}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowStreamingModal(false)}>Close</button>
                                <button className="btn btn-primary" onClick={handleSaveProviders}>Save Changes</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <EditWatchSites
                show={showSitesModal}
                onHide={() => setShowSitesModal(false)}
                watchSites={watchSites}
                onSave={handleSaveSites}
            />

            {showImportModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold">Import TV Shows</h5>
                                <button type="button" className="btn-close" onClick={() => setShowImportModal(false)} disabled={isImporting}></button>
                            </div>
                            <div className="modal-body">
                                <p className="text-muted small mb-2">Format: <code>Title (Year) [x] {'{Rating}'}</code></p>
                                <textarea className="form-control" rows="10" value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Breaking Bad (2008) [x] {10}&#10;Succession (2018) []" disabled={isImporting} />
                                {importStatus && <div className={`mt-2 small ${importStatus.startsWith("Done") ? "text-success" : "text-info"}`}>{importStatus}</div>}
                            </div>
                            <div className="modal-footer border-0 Pt-0">
                                <button className="btn btn-light" onClick={() => setShowImportModal(false)} disabled={isImporting}>Close</button>
                                <button className="btn btn-primary px-4" onClick={handleImportWatchlist} disabled={isImporting || !importText.trim()}>{isImporting ? "Importing..." : "Import"}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showExportModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Export TV Shows</h5>
                                <button type="button" className="btn-close" onClick={() => setShowExportModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <textarea className="form-control" rows="10" readOnly value={exportText} />
                                <button className="btn btn-primary w-100 mt-3" onClick={() => { navigator.clipboard.writeText(exportText); alert("Copied to clipboard!"); }}>Copy to Clipboard</button>
                            </div>
                            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowExportModal(false)}>Close</button></div>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default Tvshows;