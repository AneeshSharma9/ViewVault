// Cross-source ratings for media cards.
//
// The cards used to show TMDB's own vote_average only (e.g. 8.4 -> "84%"), but
// TMDB's score frequently disagrees with IMDb / Rotten Tomatoes for the same
// title. These helpers resolve the IMDb + Rotten Tomatoes scores via OMDb and
// keep them next to the TMDB score so cards can display all three.

const OMDb_BASE_URL = 'https://www.omdbapi.com/';
const omdbCache = new Map(); // imdbId -> { imdb, rottentomatoes } | null
const imdbIdCache = new Map(); // tmdbId -> imdbId | null

const toFloat = (value) => {
    const n = parseFloat(value);
    return isNaN(n) ? null : n;
};

// IMDb rating (0-10) + Rotten Tomatoes critic score (0-100) for an IMDb id.
export const fetchOmdbInfo = async (imdbId) => {
    if (!imdbId) return null;
    if (omdbCache.has(imdbId)) return omdbCache.get(imdbId);
    try {
        const response = await fetch(
            `${OMDb_BASE_URL}?i=${encodeURIComponent(imdbId)}&apikey=${process.env.REACT_APP_OMDB_API_KEY}`
        );
        if (!response.ok) throw new Error(`OMDb request failed with status ${response.status}`);
        const data = await response.json();
        const info = {
            imdb: data?.imdbRating && data.imdbRating !== 'N/A' ? toFloat(data.imdbRating) : null,
            rottentomatoes: null,
        };
        const sources = Array.isArray(data?.Ratings) ? data.Ratings : [];
        const rtSource = sources.find((s) => (s.Source || '').toLowerCase().includes('rotten'));
        if (rtSource) info.rottentomatoes = toFloat((rtSource.Value || '').split('%')[0]);
        omdbCache.set(imdbId, info);
        return info;
    } catch (error) {
        omdbCache.set(imdbId, null);
        return null;
    }
};

// TMDB id -> IMDb id (cached so repeat lookups are free).
export const fetchTmdbImdbId = async (tmdbId) => {
    if (imdbIdCache.has(tmdbId)) return imdbIdCache.get(tmdbId);
    try {
        const response = await fetch(
            `https://api.themoviedb.org/3/movie/${tmdbId}/external_ids?api_key=${process.env.REACT_APP_API_KEY}`
        );
        const data = await response.json();
        const imdbId = data?.imdb_id || null;
        imdbIdCache.set(tmdbId, imdbId);
        return imdbId;
    } catch (error) {
        imdbIdCache.set(tmdbId, null);
        return null;
    }
};

// Normalize a 0-10 score (TMDB / IMDb style) or a 0-100 score (Rotten Tomatoes
// style) into a display percentage plus matching text/badge color classes.
export const toScorePercent = (value, isPercent = false) => {
    const n = toFloat(value);
    if (n === null) return null;
    const percent = isPercent ? n : n * 10;
    const rounded = Math.round(percent);
    return {
        percent,
        textClass: rounded >= 70 ? 'text-success' : rounded >= 50 ? 'text-warning' : 'text-danger',
        badgeClass: rounded >= 70 ? 'bg-success' : rounded >= 50 ? 'bg-warning text-dark' : 'bg-danger',
    };
};

// Average of the available cross-source ratings (TMDB / IMDb / Rotten Tomatoes)
// into a single 0-10 score. Falls back to null when no source is available.
export const consensusScore10 = (info) => {
    if (!info) return null;
    const scores = [];
    if (info.tmdb) scores.push(info.tmdb);
    if (info.imdb) scores.push(info.imdb);
    if (info.rottentomatoes != null) scores.push(info.rottentomatoes / 10);
    if (scores.length === 0) return null;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.round(avg * 10) / 10;
};

// Consensus score formatted as a display percentage (0-100).
export const consensusPercent = (info) => {
    const score = consensusScore10(info);
    return score == null ? null : Math.round(score * 10);
};
