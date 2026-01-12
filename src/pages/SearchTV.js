import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import { auth, db } from "../utils/firebase"
import { ref, push, get } from "firebase/database";
import Footer from "./Footer";
import MovieCardGrid from "../components/MovieCardGrid";


const SearchTV = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [addedShows, setAddedShows] = useState({});
    const [uid, setUid] = useState(null);
    const inputRef = useRef(null);
    const [customWatchlists, setCustomWatchlists] = useState([]);
    const [genres, setGenres] = useState([]);
    const [tvRatings, setTvRatings] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const uid = user.uid;
                setUid(uid);
                if (uid) {
                    const addedShowsData = {};

                    // Get shows from default watchlist (tvlist)
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
            <Navbar></Navbar>
            <div className="container">
                <h1 className="text-center p-5 fw-bold">Find TV Shows</h1>
                <div className="input-group p-3 search-bar-container">
                    <input type="text" className="form-control" placeholder="Search for a tv show..." ref={inputRef} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleKeyDown} onFocus={handleInputFocus} />
                    <div className="input-group-append">
                        <button className="btn btn-primary" type="button" onClick={handleSearch}>Search</button>
                    </div>
                </div>

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