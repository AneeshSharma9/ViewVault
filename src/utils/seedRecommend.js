import { consensusScore10 } from './ratings';

// Seed recommendation engine: build a taste profile from the user's vault
// and score TMDB candidates against it (MovieNyte-style ranking).

// Parse "Action • Adventure" (or "Action / Adventure") into names
export const parseGenres = (s) =>
    (s || '')
        .split(/[•/|,]/)
        .map(g => g.trim())
        .filter(Boolean);

// Ordered age tiers so we can derive "no stricter than the vault" cap
export const ratingTier = (r) => {
    if (!r) return null;
    const u = r.toUpperCase();
    if (['G', 'TV-Y', 'TV-G'].includes(u)) return 0;
    if (['PG', 'TV-PG', 'TV-Y7'].includes(u)) return 1;
    if (['PG-13', 'TV-14'].includes(u)) return 2;
    if (['R', 'NC-17', 'TV-MA'].includes(u)) return 3;
    return 3;
};

// Most permissive tier present in the vault = the cap for discover (movie only).
// Vault has an R-rated title => no cap. Vault tops out at PG-13 => cert <= PG-13.
export const ageCapForVault = (items) => {
    const tiers = items.map(i => ratingTier(i.agerating)).filter(t => t !== null);
    if (tiers.length === 0) return null;
    const max = Math.max(...tiers);
    if (max >= 3) return null;
    return ['G', 'PG', 'PG-13'][max];
};

// IMDB-style weighted rating so low-vote outliers don't top the list
export const weightedRating = (R, v, C, m = 200) => (v * R + m * C) / (v + m);

// Build the taste profile from vault items. User ratings sharpen the signal:
//  9-10 → worth 4x, 7-8x → 2.5x, ≤4 → 0.25x (actively disliked)
//  loved (>=8) genres are tracked separately for a bonus.
export const buildSeed = (items, genreList) => {
    const counts = new Map();
    const lovedCounts = new Map();
    const genreIdsByName = new Map(genreList.map(g => [g.name.toLowerCase(), g.id]));

    for (const item of items) {
        const love = typeof item.user_rating === 'number' ? item.user_rating : null;
        const weight = love === null ? 1 : love >= 8 ? 4 : love >= 7 ? 2.5 : love <= 4 ? 0.25 : 1;
        for (const name of parseGenres(item.genres)) {
            const id = genreIdsByName.get(name.toLowerCase());
            if (!id) continue;
            counts.set(id, (counts.get(id) || 0) + weight);
            if (love !== null && love >= 8) lovedCounts.set(id, (lovedCounts.get(id) || 0) + 1);
        }
    }

    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const topGenres = ranked.slice(0, 5).map(([id]) => id);

    // Always include Animation if the vault leans into it (anime/animation vault)
    const animationWeight = counts.get(16) || 0;
    if (animationWeight >= items.length * 0.35 && !topGenres.includes(16) && topGenres.length > 0) {
        topGenres[topGenres.length - 1] = 16;
    }

    const lovedGenres = new Set(
        [...lovedCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id)
    );

    return { topGenres, lovedGenres };
};

// affinity 0..1 — how much of the seed taste a candidate covers (loved genres count double)
export const affinityOf = (candidate, topGenres, lovedGenres) => {
    if (topGenres.length === 0) return 0.5;
    const cg = candidate.genre_ids || [];
    let score = 0;
    let max = 0;
    for (const id of topGenres) {
        const w = lovedGenres.has(id) ? 2 : 1;
        max += w;
        if (cg.includes(id)) score += w;
    }
    return score / max;
};

export const similarityScore = (candidate, { C, topGenres, lovedGenres, currentYear, scores }) => {
    const v = candidate.vote_count || 0;
    const consensus = scores ? consensusScore10(scores[candidate.id]) : null;
    const R = consensus ?? candidate.vote_average ?? 0;
    const weighted = weightedRating(R, v, C);
    const affinity = affinityOf(candidate, topGenres, lovedGenres);
    const dateStr = candidate.release_date || candidate.first_air_date || '';
    const year = parseInt(dateStr.substring(0, 4), 10);
    const recency = isNaN(year) ? 0 : Math.max(0, Math.min(1, (year - (currentYear - 8)) / 8));
    return weighted * (4 + 6 * affinity) + recency * 2;
};
