import { useState, useEffect, useMemo } from 'react';
import { fetchOmdbInfo, fetchTmdbImdbId } from '../utils/ratings';

// Resolves the full cross-source ratings (TMDB + IMDb + Rotten Tomatoes via
// OMDb) for a list of media items and exposes them as a map keyed by TMDB id.
//
// Items may come from TMDB-backed sources (recommendations, search) and may or
// may not already carry an IMDb id. Items that have one are looked up directly;
// items without are resolved through TMDB's external_ids first.
const useMediaRatings = (items = [], enabled = true) => {
    const [ratings, setRatings] = useState({});
    const [loading, setLoading] = useState(false);

    const itemsKey = useMemo(
        () => (Array.isArray(items) ? items.map(i => String(i.movieid ?? i.tvshowid ?? i.id ?? i.imdbid ?? '')).join(',') : ''),
        [items]
    );

    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            if (!enabled || !itemsKey) {
                setRatings({});
                return;
            }
            setLoading(true);
            try {
                const entries = new Map(); // tmdbId -> { tmdbId, imdbId, tmdb }
                const order = [];
                const seen = new Set();
                for (const item of items) {
                    const rawId = item.movieid ?? item.tvshowid ?? item.id;
                    const imdbId = item.imdbid ?? item.imdb_id ?? null;
                    if (rawId == null) continue;
                    const key = String(rawId);
                    if (seen.has(key)) continue;
                    seen.add(key);
                    const tmdbId = Number(rawId);
                    if (!entries.has(tmdbId)) {
                        entries.set(tmdbId, {
                            tmdbId,
                            imdbId,
                            tmdb: item.vote_average ?? item.voteAverage ?? null,
                        });
                        order.push(tmdbId);
                    }
                }

                // Resolve missing IMDb ids via TMDB first (batched to stay in rate limits)
                const imdbIdMap = new Map();
                const unresolved = order.filter((id) => entries.get(id).imdbId == null);
                for (let i = 0; i < unresolved.length; i += 25) {
                    const batch = unresolved.slice(i, i + 25);
                    const ids = await Promise.all(batch.map((id) => fetchTmdbImdbId(id)));
                    batch.forEach((id, idx) => imdbIdMap.set(id, ids[idx]));
                }

                // Then fetch the actual ratings via OMDb
                const results = new Map();
                await Promise.all(order.map(async (tmdbId) => {
                    const entry = entries.get(tmdbId);
                    const imdbId = entry.imdbId || imdbIdMap.get(tmdbId) || null;
                    const info = await fetchOmdbInfo(imdbId);
                    results.set(tmdbId, { ...entry, ...(info || {}) });
                }));

                if (cancelled) return;
                const map = {};
                for (const [tmdbId, entry] of results) {
                    map[tmdbId] = entry;
                }
                setRatings(map);
            } catch (error) {
                console.error('Error fetching media ratings:', error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        run();
        return () => { cancelled = true; };
    }, [itemsKey, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

    return { ratings, loading };
};

export default useMediaRatings;
