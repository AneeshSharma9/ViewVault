import Navbar from "./Navbar";
import { useLocation } from 'react-router-dom';
import React, { useState, useEffect } from "react";
import axios from "axios";
import { auth, db } from "../utils/firebase"
import { ref, push, get } from "firebase/database";
import Footer from "./Footer";
import MovieCardGrid from "../components/MovieCardGrid";

const RecommendedShows = () => {
    const [searchResults, setSearchResults] = useState([]);
    const [addedShows, setAddedShows] = useState({});
    const [uid, setUid] = useState(null);
    const location = useLocation();
    const [customWatchlists, setCustomWatchlists] = useState([]);
    const [genres, setGenres] = useState([]);
    const [tvRatings, setTvRatings] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                const uid = user.uid;
                setUid(uid);
                if (uid) {
                    searchShow();
                }
            } else {
                setUid(null);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const uid = user.uid;
                setUid(uid);
                if (uid) {
                    const addedShowsData = {};

                    // Get shows from default watchlist
                    try {
                        const userShowListRef = ref(db, `users/${uid}/defaultwatchlists/tvshows/items`);
                        const snapshot = await get(userShowListRef);
                        if (snapshot.exists()) {
                            const showsData = snapshot.val();
                            Object.values(showsData).forEach((show) => {
                                if (show.tvshowid) {
                                    addedShowsData[show.tvshowid] = true;
                                }
                            });
                        }
                    } catch (error) {
                        console.error('Error fetching user tv shows:', error);
                    }

                    // Fetch custom watchlists of type "tvshows"
                    try {
                        const watchlistsRef = ref(db, `users/${uid}/customwatchlists`);
                        const watchlistsSnapshot = await get(watchlistsRef);
                        if (watchlistsSnapshot.exists()) {
                            const data = watchlistsSnapshot.val();
                            const tvLists = [];

                            for (const key of Object.keys(data)) {
                                if (data[key].type === 'tvshows') {
                                    tvLists.push({
                                        id: key,
                                        ...data[key]
                                    });

                                    // Check items in this custom list
                                    if (data[key].items) {
                                        Object.values(data[key].items).forEach((show) => {
                                            if (show.tvshowid) {
                                                addedShowsData[show.tvshowid] = true;
                                            }
                                        });
                                    }
                                }
                            }
                            setCustomWatchlists(tvLists);
                        }
                    } catch (error) {
                        console.error('Error fetching custom watchlists:', error);
                    }

                    setAddedShows(addedShowsData);
                }
            } else {
                setUid(null);
            }
        });
        return () => unsubscribe();
    }, []);

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

    const searchShow = async () => {
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
    };

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
        <div className="">
            <Navbar />
            <div className="container">
                <h1 className="text-center p-5 fw-bold">TV Shows like {location.state.name || location.state.title}</h1>
                <MovieCardGrid
                    key={isLoading ? "loading" : "results"}
                    movies={searchResults}
                    genres={genres}
                    movieRatings={tvRatings}
                    addedMovies={addedShows}
                    customWatchlists={customWatchlists}
                    handleAddMovie={handleAddTVShow}
                    defaultWatchlistName="TV Shows (Default)"
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
            </div>
            <Footer />
        </div>
    );
};

export default RecommendedShows;