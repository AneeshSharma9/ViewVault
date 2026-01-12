import { useState, useEffect, useMemo, useCallback } from "react";
import { auth, db } from "../utils/firebase";
import { ref, get, remove, update } from "firebase/database";
import axios from "axios";

const useVault = (type, listId) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uid, setUid] = useState(null);
    const [listName, setListName] = useState(type === 'movie' ? "Movie Vault" : "TV Show Vault");
    const [watchSites, setWatchSites] = useState(type === 'movie' ? [
        { name: "Lookmovie", url: "https://lookmovie.foundation/movies/search/?q=", format: "%20" },
        { name: "DopeBox", url: "https://dopebox.to/search/", format: "-" }
    ] : [
        { name: "Lookmovie", url: "https://lookmovie.foundation/shows/search/?q=", format: "%20" },
        { name: "DopeBox", url: "https://dopebox.to/search/", format: "-" }
    ]);
    const [availableProviders, setAvailableProviders] = useState([]);
    const [selectedProviders, setSelectedProviders] = useState([]);
    const [streamingFilter, setStreamingFilter] = useState([]);
    const [sortBy, setSortBy] = useState("Default");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshStatus, setRefreshStatus] = useState("");
    const [resolvedBase, setResolvedBase] = useState("");

    const getItemsPath = useCallback((currentUid) => {
        if (resolvedBase) return `${resolvedBase}/items`;
        const base = listId
            ? `users/${currentUid}/customwatchlists/${listId}`
            : `users/${currentUid}/defaultwatchlists/${type === 'movie' ? 'movies' : 'tvshows'}`;
        return `${base}/items`;
    }, [listId, type, resolvedBase]);

    const getSettingsPath = useCallback((currentUid) => `users/${currentUid}/settings/${type === 'movie' ? 'movies' : 'tvshows'}`, [type]);

    const fetchData = useCallback(async (currentUid) => {
        if (!currentUid) return;
        setLoading(true);
        try {
            // Determine the correct path by checking new and legacy locations
            let resolvedBase = "";
            let resolvedItems = null;

            if (listId) {
                // Only use customwatchlists as per request
                resolvedBase = `users/${currentUid}/customwatchlists/${listId}`;
                const snap = await get(ref(db, resolvedBase));
                if (snap.exists()) {
                    const val = snap.val();
                    setListName(val.name || "Custom Vault");
                    resolvedItems = val.items;
                }
            } else {
                const defaultSegment = type === 'movie' ? 'movies' : 'tvshows';
                // Only use defaultwatchlists as per request
                const path = `users/${currentUid}/defaultwatchlists/${defaultSegment}`;

                const snap = await get(ref(db, path));
                if (snap.exists()) {
                    resolvedBase = path;
                    resolvedItems = snap.val()?.items;
                } else {
                    resolvedBase = path;
                }
            }

            setResolvedBase(resolvedBase);

            // Map and set items
            if (resolvedItems) {
                const mapped = Object.keys(resolvedItems).map(key => {
                    const item = resolvedItems[key];
                    return {
                        id: key,
                        movieid: item.movieid || item.tvshowid,
                        tvshowid: item.tvshowid || item.movieid,
                        name: item.tvshowtitle || item.movietitle || item.name,
                        watched: item.watched,
                        runtime: item.runtime,
                        num_episodes: item.numepisodes || item.num_episodes,
                        providers: item.providers,
                        agerating: item.agerating,
                        vote_average: item.voteaverage || item.vote_average,
                        genres: item.genres,
                        releaseyear: item.releaseyear,
                        first_air_date: item.first_air_date,
                        imdbid: item.imdbid,
                        poster_path: item.poster_path,
                        user_rating: item.user_rating
                    };
                });
                setItems(mapped);
            } else {
                setItems([]);
            }

            // Fetch Settings
            const settingsRef = ref(db, getSettingsPath(currentUid));
            const settingsSnap = await get(settingsRef);
            if (settingsSnap.exists()) {
                const settings = settingsSnap.val();
                if (settings.watchsites) setWatchSites(settings.watchsites);
                if (settings.streamingservices) setSelectedProviders(settings.streamingservices);
            }

            // Fetch Available Providers
            const provResponse = await axios.get(`https://api.themoviedb.org/3/watch/providers/${type === 'movie' ? 'movie' : 'tv'}`, {
                params: { api_key: process.env.REACT_APP_API_KEY, watch_region: 'US' }
            });
            const providers = provResponse.data.results || [];
            providers.sort((a, b) => a.provider_name.localeCompare(b.provider_name));
            setAvailableProviders(providers);

        } catch (error) {
            console.error("Error fetching vault data:", error);
        } finally {
            setLoading(false);
        }
    }, [listId, type, getItemsPath, getSettingsPath]);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                setUid(user.uid);
                fetchData(user.uid);
            } else {
                setUid(null);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [fetchData]);

    const handleToggleWatched = async (item, currentWatched, rating = null) => {
        try {
            const itemRef = ref(db, `${getItemsPath(uid)}/${item.id}`);
            const updates = { watched: !currentWatched };
            if (!currentWatched) { // Marking as watched
                if (rating !== null) updates.user_rating = rating;
            } else { // Unmarking
                updates.user_rating = null;
            }
            await update(itemRef, updates);
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, ...updates } : i));
        } catch (error) {
            console.error("Error toggling watched status:", error);
        }
    };

    const handleDelete = async (itemId) => {
        try {
            await remove(ref(db, `${getItemsPath(uid)}/${itemId}`));
            setItems(prev => prev.filter(i => i.id !== itemId));
            return true;
        } catch (error) {
            console.error("Error deleting item:", error);
            return false;
        }
    };

    const handleClear = async () => {
        try {
            await remove(ref(db, getItemsPath(uid)));
            setItems([]);
            return true;
        } catch (error) {
            console.error("Error clearing list:", error);
            return false;
        }
    };

    const handleSaveProviders = async (providers) => {
        try {
            await update(ref(db, getSettingsPath(uid)), { streamingservices: providers });
            setSelectedProviders(providers);
            return true;
        } catch (error) {
            console.error("Error saving providers:", error);
            return false;
        }
    };

    const handleSaveSites = async (sites) => {
        try {
            await update(ref(db, getSettingsPath(uid)), { watchsites: sites });
            setWatchSites(sites);
            return true;
        } catch (error) {
            console.error("Error saving sites:", error);
            return false;
        }
    };

    const filteredItems = useMemo(() => {
        let result = items;

        if (streamingFilter.length > 0) {
            result = result.filter(item =>
                item.providers && item.providers.length > 0 &&
                streamingFilter.some(p => item.providers.includes(p))
            );
        }

        const sorted = [...result];
        if (sortBy === "To Watch") {
            sorted.sort((a, b) => a.watched - b.watched);
        } else if (sortBy === "Watched") {
            sorted.sort((a, b) => b.watched - a.watched);
        } else if (sortBy === "Runtime") {
            sorted.sort((a, b) => (a.runtime || 0) - (b.runtime || 0));
        } else if (sortBy === "Episodes") {
            sorted.sort((a, b) => (b.num_episodes || 0) - (a.num_episodes || 0));
        } else if (sortBy === "User Rating") {
            sorted.sort((a, b) => (b.user_rating || -1) - (a.user_rating || -1));
        } else if (sortBy === "Release Year") {
            sorted.sort((a, b) => {
                const yearA = parseInt(a.releaseyear) || 9999;
                const yearB = parseInt(b.releaseyear) || 9999;
                return yearA - yearB;
            });
        }
        return sorted;
    }, [items, streamingFilter, sortBy]);

    return {
        items,
        filteredItems,
        loading,
        uid,
        listName,
        watchSites,
        availableProviders,
        selectedProviders,
        streamingFilter,
        setStreamingFilter,
        sortBy,
        handleSortBy: setSortBy,
        isRefreshing,
        setIsRefreshing,
        refreshStatus,
        setRefreshStatus,
        handleToggleWatched,
        handleDelete,
        handleClear,
        handleSaveProviders,
        handleSaveSites,
        refreshData: () => fetchData(uid)
    };
};

export default useVault;
