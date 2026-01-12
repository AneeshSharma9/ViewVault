import { useLocation } from 'react-router-dom';
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { auth, db } from "../utils/firebase"
import { ref, push, get } from "firebase/database";
import Footer from "./Footer";
import MovieCardGrid from "../components/MovieCardGrid";

const RecommendedShows = () => {
    const [searchResults, setSearchResults] = useState([]);
    const [addedShows, setAddedShows] = useState({});
    const location = useLocation();
    const [customVaults, setCustomVaults] = useState([]);
    const [genres, setGenres] = useState([]);
    const [tvRatings, setTvRatings] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    const searchShow = useCallback(async () => {
        if (!location.state?.tvshowid && !location.state?.id) return;
        setIsLoading(true);
        setSearchResults([]);
        setCurrentPage(1);
        try {
            const response = await axios.get(`https://api.themoviedb.org/3/tv/${location.state.tvshowid || location.state.id}/recommendations`, {
                params: {
                    api_key: process.env.REACT_APP_API_KEY,
                    page: 1
                }
            });
            setSearchResults(response.data.results);
            setTotalPages(response.data.total_pages);
        } catch (error) {
            console.error('Error fetching tv shows:', error);
        }
        setIsLoading(false);
    }, [location.state?.tvshowid, location.state?.id]);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const uid = user.uid;
                if (uid) {
                    searchShow();
                    const addedShowsData = {};

                    try {
                        const path = `users/${uid}/defaultwatchlists/tvshows/items`;
                        const snap = await get(ref(db, path));
                        if (snap.exists()) {
                            Object.values(snap.val()).forEach(s => { if (s.tvshowid) addedShowsData[s.tvshowid] = true; });
                        }
                    } catch (error) {
                        console.error('Error fetching user tv shows:', error);
                    }

                    // Fetch custom vaults
                    try {
                        const vaultsRef = ref(db, `users/${uid}/customwatchlists`);
                        const snapshot = await get(vaultsRef);
                        const tvLists = {};

                        if (snapshot.exists()) {
                            const data = snapshot.val();
                            for (const key of Object.keys(data)) {
                                if (data[key].type === 'tvshows') {
                                    tvLists[key] = { id: key, ...data[key] };
                                    if (data[key].items) {
                                        Object.values(data[key].items).forEach(s => { if (s.tvshowid) addedShowsData[s.tvshowid] = true; });
                                    }
                                }
                            }
                        }

                        setCustomVaults(Object.values(tvLists));
                    } catch (error) {
                        console.error('Error fetching custom vaults:', error);
                    }

                    setAddedShows(addedShowsData);
                }
            }
        });
        return () => unsubscribe();
    }, [searchShow]);

    // Fetch genres
    useEffect(() => {
        const fetchGenres = async () => {
            try {
                const response = await axios.get(`https://api.themoviedb.org/3/genre/tv/list?language=en`, {
                    params: { api_key: process.env.REACT_APP_API_KEY }
                });
                setGenres(response.data.genres);
            } catch (error) {
                console.error('Error fetching genres:', error);
            }
        };
        fetchGenres();
    }, []);

    // Fetch ratings for recommended shows
    useEffect(() => {
        const fetchRatings = async () => {
            const showsToFetch = searchResults.filter(s => !tvRatings[s.id]);
            if (showsToFetch.length === 0) return;

            const newRatings = { ...tvRatings };
            for (let i = 0; i < showsToFetch.length; i += 5) {
                const batch = showsToFetch.slice(i, i + 5);
                const promises = batch.map(async (show) => {
                    try {
                        const response = await axios.get(
                            `https://api.themoviedb.org/3/tv/${show.id}/content_ratings`,
                            { params: { api_key: process.env.REACT_APP_API_KEY } }
                        );
                        const usRating = response.data.results.find(r => r.iso_3166_1 === 'US');
                        return { id: show.id, rating: usRating ? usRating.rating : 'NR' };
                    } catch {
                        return { id: show.id, rating: 'NR' };
                    }
                });
                const results = await Promise.all(promises);
                results.forEach(r => { newRatings[r.id] = r.rating; });
            }
            setTvRatings(newRatings);
        };
        if (searchResults.length > 0) fetchRatings();
    }, [searchResults]); // eslint-disable-line react-hooks/exhaustive-deps



    const loadMoreShows = async () => {
        if (currentPage >= totalPages) return;
        setIsFetchingMore(true);
        const nextPage = currentPage + 1;
        try {
            const response = await axios.get(`https://api.themoviedb.org/3/tv/${location.state.tvshowid || location.state.id}/recommendations`, {
                params: {
                    api_key: process.env.REACT_APP_API_KEY,
                    page: nextPage
                }
            });
            setSearchResults(prev => [...prev, ...response.data.results]);
            setCurrentPage(nextPage);
        } catch (error) {
            console.error('Error fetching more tv shows:', error);
        }
        setIsFetchingMore(false);
    };

    const handleAddTVShow = async (tvshow, listId = null) => {
        const detailsRes = await axios.get(`https://api.themoviedb.org/3/tv/${tvshow.id}`, {
            params: { api_key: process.env.REACT_APP_API_KEY }
        });
        const showDetails = detailsRes.data;
        const genreString = showDetails.genres.map(g => g.name).join(' • ');

        const ratingsRes = await axios.get(`https://api.themoviedb.org/3/tv/${tvshow.id}/content_ratings`, {
            params: { api_key: process.env.REACT_APP_API_KEY }
        });
        const usRating = ratingsRes.data.results.find(r => r.iso_3166_1 === "US");

        const providersRes = await axios.get(`https://api.themoviedb.org/3/tv/${tvshow.id}/watch/providers`, {
            params: { api_key: process.env.REACT_APP_API_KEY }
        });
        let providerNames = [];
        if (providersRes.data.results.US && providersRes.data.results.US.flatrate) {
            providerNames = providersRes.data.results.US.flatrate.map(p => p.provider_name);
        }

        const uid = auth.currentUser.uid;
        if (uid) {
            const listPath = listId
                ? `users/${uid}/customwatchlists/${listId}/items`
                : `users/${uid}/defaultwatchlists/tvshows/items`;
            await push(ref(db, listPath), {
                tvshowtitle: tvshow.name,
                tvshowid: tvshow.id,
                watched: false,
                providers: providerNames,
                agerating: usRating ? usRating.rating : null,
                voteaverage: tvshow.vote_average,
                numepisodes: showDetails.number_of_episodes,
                genres: genreString,
                first_air_date: showDetails.first_air_date,
                poster_path: tvshow.poster_path || ''
            });
            setAddedShows({ ...addedShows, [tvshow.id]: true });
        }
    };

    return (
        <div className="fade-in">
            <div className="search-hero">
                <div className="container">
                    <h1 className={`search-title-premium ${isLoading ? 'opacity-0' : 'animate-fade-in'}`}>
                        Similar to {location.state.name || location.state.title}
                    </h1>
                    <p className={`text-muted fs-5 ${isLoading ? 'opacity-0' : 'animate-slide-up'}`}>
                        Binge-worthy series with a similar vibe.
                    </p>
                </div>
            </div>

            {!isLoading && (
                <div className="container pb-5 px-5">
                    <MovieCardGrid
                        key="results"
                        movies={searchResults}
                        genres={genres}
                        movieRatings={tvRatings}
                        addedMovies={addedShows}
                        customVaults={customVaults}
                        handleAddMovie={handleAddTVShow}
                        defaultVaultName="TV Shows (Default)"
                        loading={isLoading}
                    />

                    {searchResults.length > 0 && currentPage < totalPages && (
                        <div className="text-center my-5 animate-fade-in">
                            <button
                                className="btn btn-premium btn-premium-outline px-5"
                                onClick={loadMoreShows}
                                disabled={isFetchingMore}
                            >
                                {isFetchingMore ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Loading...
                                    </>
                                ) : (
                                    "Load More Recommendations"
                                )}
                            </button>
                        </div>
                    )}
                    <Footer />
                </div>
            )}
        </div>
    );
};

export default RecommendedShows;