import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { auth, db } from "../utils/firebase";
import { ref, push, get } from "firebase/database";
import Footer from "./Footer";
import MovieCardGrid from "../components/MovieCardGrid";
import useVault from "../hooks/useVault";
import { ageCapForVault, buildSeed, similarityScore } from "../utils/seedRecommend";

const PAGE_SIZE = 30;
const POOL_TARGET = 120; // kept (non-vault) matches to collect up front
const POOL_ROUND_SIZE = 4; // top-rated pages per round while scanning
const TOP_PAGES_PER_LOAD = 4; // extra pages per "Load More"
const FRESH_PAGES_PER_LOAD = 1;
const MAX_DISCOVER_PAGE = 60;

// Similar-titles recommendations for a vault: analyzes the vault (genres
// weighted by user ratings, style such as animation/dominant origin countries,
// age-rating ceiling, favorite taste) and recommends TMDB movies/shows,
// ranked MovieNyte-style. Route: /vaultrecommendations?type=movie|tv&list=<id>
const VaultRecommendations = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const type = searchParams.get('type') === 'tv' ? 'tv' : 'movie';
    const listId = searchParams.get('list');

    const isMovie = type === 'movie';
    const idField = isMovie ? 'movieid' : 'tvshowid';

    const {
        items,
        loading,
        listName
    } = useVault(isMovie ? 'movie' : 'tv', listId);

    const defaultLabel = listId ? (listName || 'Custom Vault') : (isMovie ? "Movies (Default)" : "TV Shows (Default)");
    const backTo = isMovie ? '/movies' : '/tvshows';
    const backPath = listId ? `${backTo}?list=${listId}` : backTo;

    const [genres, setGenres] = useState([]);
    const [analyzing, setAnalyzing] = useState(false);
    const [status, setStatus] = useState("");
    const [hasRun, setHasRun] = useState(false);

    const [seedCtx, setSeedCtx] = useState(null); // { C, topGenres, lovedGenres, currentYear }
    const [discoverParams, setDiscoverParams] = useState(null);
    const [poolPages, setPoolPages] = useState({ top: 0, fresh: 0 });
    const [poolExhausted, setPoolExhausted] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const [allMovies, setAllMovies] = useState([]);
    const [orderedMovies, setOrderedMovies] = useState([]);
    const orderRef = useRef([]);
    const [page, setPage] = useState(1);
    const [hideInVault, setHideInVault] = useState(false);

    const [addedItems, setAddedItems] = useState({});
    const [customVaults, setCustomVaults] = useState([]);

    // TMDB genre list for this media type
    useEffect(() => {
        const fetchGenres = async () => {
            try {
                const res = await axios.get(`https://api.themoviedb.org/3/genre/${isMovie ? 'movie' : 'tv'}/list?language=en`, {
                    params: { api_key: process.env.REACT_APP_API_KEY }
                });
                setGenres(res.data.genres || []);
            } catch (e) {
                console.error('Error fetching genres:', e);
            }
        };
        fetchGenres();
    }, [isMovie]);

    // Already-in-vault lookup (for "In <vault>" buttons + Hide In-Vault toggle)
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (!user) {
                setAddedItems({});
                setCustomVaults([]);
                return;
            }
            const currentUid = user.uid;
            const data = {};
            try {
                const path = `users/${currentUid}/defaultwatchlists/${isMovie ? 'movies' : 'tvshows'}/items`;
                const snap = await get(ref(db, path));
                if (snap.exists()) {
                    Object.values(snap.val()).forEach(m => { if (m[idField]) data[m[idField]] = { watched: !!m.watched, vaultName: isMovie ? "Movies (Default)" : "TV Shows (Default)" }; });
                }
            } catch (e) {
                console.error('Error fetching default vault:', e);
            }

            try {
                const vaultsRef = ref(db, `users/${currentUid}/customwatchlists`);
                const snapshot = await get(vaultsRef);
                const lists = {};
                if (snapshot.exists()) {
                    const custom = snapshot.val();
                    for (const key of Object.keys(custom)) {
                        if (custom[key].type === (isMovie ? 'movies' : 'tvshows')) {
                            lists[key] = { id: key, ...custom[key] };
                            if (custom[key].items) {
                                Object.values(custom[key].items).forEach(m => { if (m[idField]) data[m[idField]] = { watched: !!m.watched, vaultName: custom[key].name || 'Custom Vault' }; });
                            }
                        }
                    }
                }
                setCustomVaults(Object.values(lists));
            } catch (e) {
                console.error('Error fetching custom vaults:', e);
            }
            setAddedItems(data);
        });
        return () => unsubscribe();
    }, [isMovie, idField]);

    // Stable ordering: score-sort new items, keep existing ids in stored order
    useEffect(() => {
        if (!seedCtx || allMovies.length === 0) {
            setOrderedMovies([]);
            return;
        }
        const scored = [...allMovies].sort((a, b) =>
            similarityScore(b, seedCtx) - similarityScore(a, seedCtx)
        );
        const orderIndex = new Map(orderRef.current.map((id, i) => [id, i]));
        const kept = [];
        const fresh = [];
        for (const m of scored) (orderIndex.has(m.id) ? kept : fresh).push(m);
        kept.sort((a, b) => orderIndex.get(a.id) - orderIndex.get(b.id));
        const ordered = [...kept, ...fresh];
        orderRef.current = ordered.map(m => m.id);
        setOrderedMovies(ordered);
    }, [allMovies, seedCtx]);

    const handleAddToVault = async (media, destListId = null) => {
        const id = media.id;
        const title = media.title || media.name;
        try {
            const base = isMovie ? 'movie' : 'tv';
            const [detailsRes, ratingRes, providersRes, idsRes] = await Promise.all([
                fetch(`https://api.themoviedb.org/3/${base}/${id}?api_key=${process.env.REACT_APP_API_KEY}`),
                fetch(`https://api.themoviedb.org/3/${base}/${id}/release_dates?api_key=${process.env.REACT_APP_API_KEY}`),
                fetch(`https://api.themoviedb.org/3/${base}/${id}/watch/providers?api_key=${process.env.REACT_APP_API_KEY}`),
                fetch(`https://api.themoviedb.org/3/${base}/${id}/external_ids?api_key=${process.env.REACT_APP_API_KEY}`)
            ]);
            const details = await detailsRes.json();
            const genreString = (details.genres || []).map(g => g.name).join(' • ');

            let certificationForUS = null;
            try {
                const ratingData = await ratingRes.json();
                const usRelease = (ratingData.results || []).find(r => r.iso_3166_1 === 'US');
                certificationForUS = usRelease?.release_dates?.find(rd => rd.certification)?.certification || null;
            } catch { /* TV has no release_dates entries for most regions */ }

            let providerNames = [];
            try {
                const providers = await providersRes.json();
                providerNames = providers.results?.US?.flatrate?.map(p => p.provider_name) || [];
            } catch { /* providers are optional */ }

            let imdbId = null;
            try {
                const ids = await idsRes.json();
                imdbId = ids.imdb_id || null;
            } catch { /* optional */ }

            const currentUid = auth.currentUser?.uid;
            if (!currentUid) return;

            const path = destListId
                ? `users/${currentUid}/customwatchlists/${destListId}/items`
                : `users/${currentUid}/defaultwatchlists/${isMovie ? 'movies' : 'tvshows'}/items`;

            const payload = isMovie ? {
                movietitle: title,
                movieid: id,
                watched: false,
                runtime: details.runtime,
                providers: providerNames,
                agerating: certificationForUS,
                voteaverage: details.vote_average,
                genres: genreString,
                releaseyear: details.release_date?.substring(0, 4) || '',
                imdbid: imdbId,
                poster_path: details.poster_path || media.poster_path || ''
            } : {
                tvshowtitle: title,
                tvshowid: id,
                watched: false,
                numepisodes: details.number_of_episodes,
                providers: providerNames,
                agerating: certificationForUS,
                voteaverage: details.vote_average,
                genres: genreString,
                first_air_date: details.first_air_date || '',
                imdbid: imdbId,
                poster_path: details.poster_path || media.poster_path || ''
            };

            await push(ref(db, path), payload);
            const destVaultName = destListId
                ? (customVaults.find(v => v.id === destListId)?.name || 'Custom Vault')
                : defaultLabel;
            setAddedItems(prev => ({ ...prev, [id]: { watched: false, vaultName: destVaultName } }));
        } catch (e) {
            console.error('Error adding to vault:', e);
        }
    };

    const analyze = async () => {
        setAnalyzing(true);
        setHasRun(true);
        setStatus("Analyzing your vault…");
        orderRef.current = [];

        try {
            // 1. Enrich vault items with origin countries (style: anime / k-dramas / etc.)
            const slice = items.slice(0, 80);
            const countryCounts = {};
            let done = 0;
            for (let i = 0; i < slice.length; i += 12) {
                const batch = slice.slice(i, i + 12);
                const results = await Promise.all(batch.map(async (item) => {
                    try {
                        const res = await axios.get(`https://api.themoviedb.org/3/${isMovie ? 'movie' : 'tv'}/${item[idField]}`, {
                            params: { api_key: process.env.REACT_APP_API_KEY }
                        });
                        return res.data.origin_country || [];
                    } catch {
                        return [];
                    }
                }));
                results.flat().forEach(c => { countryCounts[c] = (countryCounts[c] || 0) + 1; });
                done += batch.length;
                setStatus(`Analyzing your vault… ${done}/${slice.length}`);
            }

            const totalCountries = Object.values(countryCounts).reduce((a, b) => a + b, 0);
            const dominantCountries = totalCountries === 0 ? [] : Object.entries(countryCounts)
                .sort((a, b) => b[1] - a[1])
                .filter(([, n]) => n / totalCountries >= 0.2)
                .slice(0, 2)
                .map(([c]) => c);

            // 2. Seed taste profile (genres weighted by user rating, loved genres, age ceiling)
            const seed = buildSeed(items, genres);
            const cap = isMovie ? ageCapForVault(items) : null;

            const params = {
                api_key: process.env.REACT_APP_API_KEY,
                sort_by: 'vote_average.desc',
                'vote_count.gte': 100,
                certification_country: 'US',
            };
            if (seed.topGenres.length > 0) params.with_genres = seed.topGenres.join('|');
            if (dominantCountries.length > 0) params.with_origin_country = dominantCountries.join('|');
            if (cap) params['certification.lte'] = cap;
            setDiscoverParams(params);
            setPoolExhausted(false);
            setIsLoadingMore(false);

            // 3. Fetch matches in rounds until we have POOL_TARGET unique non-vault picks
            const vaultIds = new Set(items.map(i => i[idField]).filter(Boolean));
            const discover = (overrides) =>
                axios.get(`https://api.themoviedb.org/3/discover/${isMovie ? 'movie' : 'tv'}`, {
                    params: { ...params, ...overrides }
                });

            const seen = new Set(vaultIds);
            const collected = [];
            let topPage = 1;
            let freshPage = 1;
            let addedLastRound = true;
            let allRequestsFailed = true;

            while (collected.length < POOL_TARGET && addedLastRound && topPage <= MAX_DISCOVER_PAGE) {
                const requests = [];
                for (let i = 0; i < POOL_ROUND_SIZE && topPage + i <= MAX_DISCOVER_PAGE; i++) {
                    requests.push(discover({ page: topPage + i }));
                }
                requests.push(discover({ sort_by: 'primary_release_date.desc', 'vote_count.gte': 25, page: freshPage }));

                const responses = await Promise.allSettled(requests);
                const before = collected.length;
                for (const res of responses) {
                    if (res.status !== 'fulfilled') continue;
                    allRequestsFailed = false;
                    for (const m of res.value.data.results || []) {
                        if (!seen.has(m.id)) {
                            seen.add(m.id);
                            collected.push(m);
                        }
                    }
                }
                addedLastRound = collected.length > before;
                topPage += POOL_ROUND_SIZE;
                freshPage += 1;
                setStatus(`Scanning TMDB… ${collected.length}/${POOL_TARGET} matches found`);
                if (collected.length >= 400) break; // safety bound
            }

            setPoolPages({ top: topPage - 1, fresh: freshPage - 1 });
            if (allRequestsFailed && collected.length === 0) {
                throw new Error('All discover requests failed');
            }

            const C = collected.length > 0
                ? collected.reduce((sum, m) => sum + (m.vote_average || 0), 0) / collected.length
                : 7;

            setSeedCtx({ C, topGenres: seed.topGenres, lovedGenres: seed.lovedGenres, currentYear: new Date().getFullYear() });
            setAllMovies(collected);
            setPage(1);
            setStatus("");
        } catch (e) {
            console.error('Error generating recommendations:', e);
            setStatus("Couldn't generate recommendations. Please try again.");
        }

        setAnalyzing(false);
    };

    // Auto-analyze once the vault and genre list are ready
    const hasRunRef = useRef(false);
    useEffect(() => {
        if (loading || genres.length === 0 || hasRunRef.current) return;
        if (items.length === 0) return; // empty vault → handled by the empty state
        hasRunRef.current = true;
        analyze();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, genres.length, items.length]);

    const loadMorePool = async () => {
        if (!discoverParams || isLoadingMore || poolExhausted) return;
        setIsLoadingMore(true);

        const topStart = poolPages.top + 1;
        const freshStart = poolPages.fresh + 1;
        const discover = (overrides) =>
            axios.get(`https://api.themoviedb.org/3/discover/${isMovie ? 'movie' : 'tv'}`, {
                params: { ...discoverParams, ...overrides }
            });

        const requests = [];
        for (let i = 0; i < TOP_PAGES_PER_LOAD && topStart + i <= MAX_DISCOVER_PAGE; i++) {
            requests.push(discover({ page: topStart + i }));
        }
        for (let i = 0; i < FRESH_PAGES_PER_LOAD && freshStart + i <= MAX_DISCOVER_PAGE; i++) {
            requests.push(discover({ sort_by: 'primary_release_date.desc', 'vote_count.gte': 25, page: freshStart + i }));
        }

        try {
            const responses = await Promise.allSettled(requests);
            const seen = new Set(allMovies.map(m => m.id));
            const added = [];
            for (const res of responses) {
                if (res.status !== 'fulfilled') continue;
                for (const m of res.value.data.results || []) {
                    const id = m.id;
                    if (!seen.has(id)) {
                        seen.add(id);
                        added.push(m);
                    }
                }
            }

            if (added.length === 0) {
                setPoolExhausted(true);
            } else {
                setAllMovies(prev => [...prev, ...added]);
                setPoolPages({
                    top: Math.min(poolPages.top + TOP_PAGES_PER_LOAD, MAX_DISCOVER_PAGE),
                    fresh: Math.min(poolPages.fresh + FRESH_PAGES_PER_LOAD, MAX_DISCOVER_PAGE),
                });
            }
        } catch (e) {
            console.error('Error loading more recommendations:', e);
        }

        setIsLoadingMore(false);
    };

    // Apply the "Hide In-Vault" toggle on top of the stable-ranked list
    const visibleMovies = useMemo(
        () => hideInVault ? orderedMovies.filter(m => !addedItems[m.id]) : orderedMovies,
        [orderedMovies, hideInVault, addedItems]
    );
    const hiddenCount = orderedMovies.length - visibleMovies.length;

    const totalPages = Math.max(1, Math.ceil(visibleMovies.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const paged = visibleMovies.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    const showFrom = visibleMovies.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
    const showTo = Math.min(safePage * PAGE_SIZE, visibleMovies.length);

    const goToPage = (target) => {
        const pageTarget = Math.min(Math.max(1, target), totalPages);
        setPage(pageTarget);
        setTimeout(() => {
            const el = document.getElementById("recs-results");
            if (!el) return;
            const navbar = document.querySelector(".topnav");
            const offset = (navbar?.offsetHeight || 70) + 8;
            const top = el.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: "smooth" });
        }, 60);
    };

    return (
        <div className="fade-in">
            <div className="search-hero">
                <div className="container">
                    <h1 className="search-title-premium animate-fade-in">Similar to Your Vault</h1>
                    <p className="text-muted fs-5 animate-slide-up">Title-matched picks based on what's in “{listName || (isMovie ? "Movie Vault" : "TV Show Vault")}”.</p>
                    <button className="btn btn-premium btn-premium-outline btn-sm rounded-pill px-4 mt-3" onClick={() => navigate(backPath)}>
                        ← Back to Vault
                    </button>
                </div>
            </div>

            <div className="container pb-5 px-5">
                {!loading && items.length === 0 && (
                    <div className="mn-empty-state text-center animate-fade-in mt-4">
                        <div className="display-1 mb-4">{isMovie ? '🎬' : '📺'}</div>
                        <h2 className="fw-bold h1 mb-3">Your Vault is Empty</h2>
                        <p className="text-muted fs-5 mb-4 mx-auto" style={{ maxWidth: '600px' }}>
                            Add {isMovie ? 'movies' : 'shows'} to your vault first, then we'll recommend more picks in the same taste.
                        </p>
                        <button
                            className="btn btn-premium btn-premium-primary px-5 py-3 shadow-sm rounded-pill fw-bold"
                            onClick={() => navigate(isMovie ? '/searchmovie' : '/searchtv')}
                        >
                            {isMovie ? 'Explore Movies' : 'Explore TV Shows'}
                        </button>
                    </div>
                )}

                {(loading || hasRun) && items.length > 0 && (
                    <div id="recs-results" className="mt-2">
                        <div className="d-flex flex-wrap align-items-center justify-content-between mb-2 px-2 gap-2">
                            <h3 className="mn-profile-name fs-2">Similar to “{listName || (isMovie ? "Movie Vault" : "TV Show Vault")}”</h3>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                <span className="badge bg-primary rounded-pill px-3 py-2 fs-6 shadow-sm">
                                    {visibleMovies.length} Match{hideInVault && hiddenCount > 0 ? ` (${hiddenCount} in vault hidden)` : ''}
                                </span>
                                <div className="form-check form-switch bg-light dark-mode-bg-dark rounded-pill px-4 py-2 border shadow-sm d-flex align-items-center gap-2 mb-0">
                                    <input
                                        className="form-check-input ms-0"
                                        type="checkbox"
                                        id="hideInVault"
                                        checked={hideInVault}
                                        onChange={(e) => { setHideInVault(e.target.checked); setPage(1); }}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <label className="form-check-label small fw-bold mb-0" htmlFor="hideInVault" style={{ whiteSpace: 'nowrap' }}>
                                        Hide In-Vault
                                    </label>
                                </div>
                                <button className="btn btn-sm btn-premium btn-premium-outline rounded-pill px-3" onClick={analyze} disabled={analyzing}>
                                    ↻ Re-analyze
                                </button>
                            </div>
                        </div>
                        <p className="text-muted small px-2 mb-4">Ranked by taste match, quality and freshness · Showing {showFrom}–{showTo} of {visibleMovies.length}</p>

                        {analyzing ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary mb-3" role="status" aria-hidden="true"></div>
                                <p className="text-muted fs-5">{status || "Analyzing your vault…"}</p>
                            </div>
                        ) : allMovies.length === 0 ? (
                            <div className="mn-empty-state text-center">
                                <div className="display-1 mb-3">🤷</div>
                                <h4 className="fw-bold mb-2">No matches found</h4>
                                <p className="text-muted mb-0">Your vault's taste points at a very specific niche. Try adding more variety to your vault!</p>
                            </div>
                        ) : visibleMovies.length === 0 ? (
                            <div className="mn-empty-state text-center">
                                <div className="display-1 mb-3">✅</div>
                                <h4 className="fw-bold mb-2">All caught up!</h4>
                                <p className="text-muted mb-0">Every recommendation is already in one of your vaults.</p>
                            </div>
                        ) : (
                            <>
                                <MovieCardGrid
                                    key={"vault-recs"}
                                    movies={paged}
                                    genres={genres}
                                    movieRatings={{}}
                                    addedMovies={addedItems}
                                    customVaults={customVaults}
                                    handleAddMovie={handleAddToVault}
                                    defaultVaultName={defaultLabel}
                                    loading={false}
                                />

                                {totalPages > 1 && (
                                    <nav className="d-flex flex-wrap justify-content-center align-items-center gap-2 my-5" aria-label="Recommendation pages">
                                        <button
                                            className="btn btn-premium btn-premium-outline px-4 py-2 fw-bold shadow-sm"
                                            onClick={() => goToPage(safePage - 1)}
                                            disabled={safePage === 1}
                                        >
                                            ← Previous
                                        </button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                            <button
                                                key={p}
                                                className={`btn px-3 py-2 fw-bold shadow-sm ${p === safePage ? "btn-premium btn-premium-primary" : "btn-premium btn-premium-outline"}`}
                                                onClick={() => goToPage(p)}
                                                aria-current={p === safePage ? "page" : undefined}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                        <button
                                            className="btn btn-premium btn-premium-outline px-4 py-2 fw-bold shadow-sm"
                                            onClick={() => goToPage(safePage + 1)}
                                            disabled={safePage === totalPages}
                                        >
                                            Next →
                                        </button>
                                    </nav>
                                )}

                                {safePage === totalPages && (
                                    <div className="text-center mt-4">
                                        <button
                                            className="btn btn-premium btn-premium-outline px-5 py-3 shadow-sm fw-bold"
                                            onClick={loadMorePool}
                                            disabled={isLoadingMore || poolExhausted}
                                        >
                                            {isLoadingMore ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Fetching More from TMDB...
                                                </>
                                            ) : poolExhausted ? "🎬 That's Every Match!" : "➕ Load More Similar Titles"}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
                {loading && items.length === 0 && (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary mb-3" role="status" aria-hidden="true"></div>
                        <p className="text-muted fs-5">Loading your vault…</p>
                    </div>
                )}
            </div>

            {!loading && <Footer />}
        </div>
    );
};

export default VaultRecommendations;
