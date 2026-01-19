import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { auth, db } from "../utils/firebase"
import { ref, push, get } from "firebase/database";
import { useLocation } from "react-router-dom";
import Footer from "./Footer";
import MovieCardGrid from "../components/MovieCardGrid";


const SearchTV = () => {
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState(location.state?.query || "");
    const [searchResults, setSearchResults] = useState([]);
    const [addedShows, setAddedShows] = useState({});
    const inputRef = useRef(null);
    const [customVaults, setCustomVaults] = useState([]);
    const [genres, setGenres] = useState([]);
    const [tvRatings, setTvRatings] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Auto-search if query is passed from navigation
    useEffect(() => {
        if (location.state?.query && location.state.query.trim()) {
            const searchTV = async () => {
                const query = location.state.query.trim();
                setIsLoading(true);
                setHasSearched(true);
                setSearchResults([]);
                setCurrentPage(1);
                try {
                    const response = await axios.get(`https://api.themoviedb.org/3/search/tv`, {
                        params: {
                            api_key: process.env.REACT_APP_API_KEY,
                            query: query,
                            page: 1
                        }
                    });
                    setSearchResults(response.data.results || []);
                    setTotalPages(response.data.total_pages || 1);
                } catch (error) {
                    console.error('Error searching TV shows:', error);
                    setSearchResults([]);
                } finally {
                    setIsLoading(false);
                }
            };
            searchTV();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.state]);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const uid = user.uid;
                if (uid) {
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
                // No uid to set
            }
        });
        return () => unsubscribe();
    }, []);

    // Fetch genres
    useEffect(() => {
        const fetchGenres = async () => {
            try {
                const response = await axios.get(`https://api.themoviedb.org/3/genre/tv/list?language=en`, {
                    params: {
                        api_key: process.env.REACT_APP_API_KEY,
                    }
                });
                setGenres(response.data.genres);
            } catch (error) {
                console.error('Error fetching genres:', error);
            }
        };
        fetchGenres();
    }, []);

    // Fetch ratings for TV shows
    useEffect(() => {
        const fetchRatings = async () => {
            const showsToFetch = searchResults.filter(s => !tvRatings[s.id]);
            if (showsToFetch.length === 0) return;

            const newRatings = { ...tvRatings };

            // Fetch ratings in parallel
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

        if (searchResults.length > 0) {
            fetchRatings();
        }
    }, [searchResults]); // eslint-disable-line react-hooks/exhaustive-deps

    const searchTV = async () => {
        if (!searchQuery.trim()) return;
        setIsLoading(true);
        setHasSearched(true);
        setSearchResults([]);
        setCurrentPage(1);
        try {
            const response = await axios.get(`https://api.themoviedb.org/3/search/tv`, {
                params: {
                    api_key: `${process.env.REACT_APP_API_KEY}`,
                    query: searchQuery,
                    page: 1
                }
            });
            setSearchResults(response.data.results);
            setTotalPages(response.data.total_pages);
        } catch (error) {
            console.error('Error fetching shows:', error);
        }
        setIsLoading(false);
    };

    const loadMoreTV = async () => {
        if (currentPage >= totalPages) return;
        setIsFetchingMore(true);
        const nextPage = currentPage + 1;
        try {
            const response = await axios.get(`https://api.themoviedb.org/3/search/tv`, {
                params: {
                    api_key: `${process.env.REACT_APP_API_KEY}`,
                    query: searchQuery,
                    page: nextPage
                }
            });
            setSearchResults(prev => [...prev, ...response.data.results]);
            setCurrentPage(nextPage);
        } catch (error) {
            console.error('Error fetching more shows:', error);
        }
        setIsFetchingMore(false);
    };

    const handleSearch = () => {
        searchTV();
    };


    const handleAddTVShow = async (tvshow, listId = null) => {
        //Getting general tv show details
        const detailsResponse = await fetch(`https://api.themoviedb.org/3/tv/${tvshow.id}?api_key=${process.env.REACT_APP_API_KEY}`);
        if (!detailsResponse.ok) {
            throw new Error('Failed to fetch tvshow details');
        }
        const showDetails = await detailsResponse.json();

        const genreString = showDetails.genres
            .map(genre => genre.name)
            .join(' • ');

        //Getting age rating
        const ratingResponse = await fetch(`https://api.themoviedb.org/3/tv/${tvshow.id}/content_ratings?api_key=${process.env.REACT_APP_API_KEY}`);
        if (!ratingResponse.ok) {
            throw new Error('Failed to fetch tvshow details');
        }
        const showRating = await ratingResponse.json();
        let certificationForUS = null;
        const results = showRating.results;
        for (const result of results) {
            if (result.iso_3166_1 === "US") {
                certificationForUS = result.rating;
                break;
            }
        }

        //Getting streaming providers
        const providersResponse = await fetch(`https://api.themoviedb.org/3/tv/${tvshow.id}/watch/providers?api_key=${process.env.REACT_APP_API_KEY}`);
        if (!providersResponse.ok) {
            throw new Error('Failed to fetch tvshow details');
        }
        const showProviders = await providersResponse.json();
        let providerNames = [];
        if (showProviders.results.US && showProviders.results.US.flatrate) {
            const flatrateProviders = showProviders.results.US.flatrate;
            providerNames = flatrateProviders.map(provider => provider.provider_name);
        }

        //Saving show to user's database
        const uid = auth.currentUser.uid;
        if (uid) {
            const listPath = listId
                ? `users/${uid}/customwatchlists/${listId}/items`
                : `users/${uid}/defaultwatchlists/tvshows/items`;
            const userShowListRef = ref(db, listPath);
            push(userShowListRef, {
                tvshowtitle: tvshow.name,
                tvshowid: tvshow.id,
                watched: false,
                providers: providerNames,
                agerating: certificationForUS,
                voteaverage: tvshow.vote_average,
                numepisodes: showDetails.number_of_episodes,
                genres: genreString,
                first_air_date: showDetails.first_air_date,
                poster_path: tvshow.poster_path || ''
            })
                .then(() => {
                    console.log('tvshow added successfully!');
                    setAddedShows({ ...addedShows, [tvshow.id]: true });
                })
                .catch((error) => {
                    console.error('Error adding tvshow:', error);
                });
        } else {
            console.error('User is not signed in!');
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            searchTV();
        }
    };

    const handleInputFocus = () => {
        inputRef.current.select();
    };


    return (
        <div className="">
            <div className="search-hero">
                <div className="container">
                    <h1 className="search-title-premium animate-fade-in">Find TV Shows</h1>
                    <div className="search-container-premium animate-slide-up">
                        <div className="search-wrapper-premium">
                            <input
                                type="text"
                                className="search-input-premium"
                                placeholder="Enter show title..."
                                ref={inputRef}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onFocus={handleInputFocus}
                            />
                            <button
                                className="search-btn-premium-inner"
                                type="button"
                                onClick={handleSearch}
                            >
                                Search
                            </button>
                        </div>
                        <p className="search-hint">Track and discover your favorite series.</p>
                    </div>
                </div>
            </div>

            <div className="container px-5">
                {!isLoading && searchResults.length === 0 && hasSearched && (
                    <div className="text-center my-5 py-5 animate-fade-in">
                        <div className="display-1 mb-4" role="img" aria-label="Search">🔍</div>
                        <h3 className="fw-bold">No results found for "{searchQuery}"</h3>
                        <p className="text-muted">Try a different title or check for typos.</p>
                    </div>
                )}

                {!isLoading && searchResults.length === 0 && !hasSearched && (
                    <div className="text-center my-5 py-5 animate-fade-in opacity-75">
                        <div className="display-1 mb-4" role="img" aria-label="TV">📺</div>
                        <h3 className="fw-bold fs-2">Your TV Show Vault Awaits</h3>
                        <p className="text-muted fs-5">Track your favorite series and discover new ones tailored to your taste.</p>
                    </div>
                )}

                <MovieCardGrid
                    key={isLoading ? "loading" : "results"}
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
                            onClick={loadMoreTV}
                            disabled={isFetchingMore}
                        >
                            {isFetchingMore ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Loading...
                                </>
                            ) : (
                                "Load More Results"
                            )}
                        </button>
                    </div>
                )}
            </div>
            <Footer></Footer>
        </div>
    );
};

export default SearchTV;