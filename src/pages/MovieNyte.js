import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import axios from "axios";
import { auth, db } from "../utils/firebase";
import { ref, push, get, set, remove } from "firebase/database";
import MovieCardGrid from "../components/MovieCardGrid";

const MovieNyte = () => {
    const initialPersonState = { id: 1, name: "Person 1", enabled: true, preferences: { genre: [], rating: [], year: '', runtime: '', country: 'US' } };
    const [people, setPeople] = useState([initialPersonState]);
    const [genres, setGenres] = useState([]);
    const [countries, setCountries] = useState([]);
    const [currentPerson, setCurrentPerson] = useState(null);
    const [customName, setCustomName] = useState("");
    const [tempPreferences, setTempPreferences] = useState({
        genre: [],
        rating: [],
        year: '',
        runtime: '',
        country: 'US'
    });
    const [recommendedMovies, setRecommendedMovies] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchMessage, setSearchMessage] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [searchParams, setSearchParams] = useState(null); // Store params for load more
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [movieRatings, setMovieRatings] = useState({}); // Store age ratings by movie ID
    const [filteredMovies, setFilteredMovies] = useState([]); // Movies filtered by selected ratings
    const [excludeAnimated, setExcludeAnimated] = useState(true); // Toggle to exclude animated movies
    const [addedMovies, setAddedMovies] = useState({}); // Track movies already in watchlists
    const [customWatchlists, setCustomWatchlists] = useState([]); // Custom movie watchlists
    const [uid, setUid] = useState(null); // User ID

    useEffect(() => {
        // Fetch genres and countries from TMDB API
        const getOptions = async () => {
            try {
                const [genreResponse, countryResponse] = await Promise.all([
                    axios.get(`https://api.themoviedb.org/3/genre/movie/list?language=en`, {
                        params: {
                            api_key: process.env.REACT_APP_API_KEY,
                        }
                    }),
                    axios.get(`https://api.themoviedb.org/3/configuration/countries`, {
                        params: {
                            api_key: process.env.REACT_APP_API_KEY,
                        }
                    })
                ]);
                setGenres(genreResponse.data.genres);
                // Sort countries alphabetically by english_name
                const sortedCountries = countryResponse.data.sort((a, b) =>
                    a.english_name.localeCompare(b.english_name)
                );
                setCountries(sortedCountries);
            } catch (error) {
                console.error('Error fetching options:', error);
            }
        };
        getOptions();
    }, []);

    useEffect(() => {
        // Get user's already added movies from all watchlists
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const uid = user.uid;
                setUid(uid);
                if (uid) {
                    const addedMoviesData = {};

                    // Get movies from default watchlist
                    try {
                        const userMovieListRef = ref(db, `users/${uid}/defaultwatchlists/movies/items`);
                        const defaultSnapshot = await get(userMovieListRef);
                        if (defaultSnapshot.exists()) {
                            const movieData = defaultSnapshot.val();
                            Object.values(movieData).forEach((movie) => {
                                if (movie.movieid) {
                                    addedMoviesData[movie.movieid] = true;
                                }
                            });
                        }
                    } catch (error) {
                        console.error('Error fetching default movies:', error);
                    }

                    // Fetch custom watchlists of type "movies" and their items
                    try {
                        const watchlistsRef = ref(db, `users/${uid}/customwatchlists`);
                        const watchlistsSnapshot = await get(watchlistsRef);
                        if (watchlistsSnapshot.exists()) {
                            const data = watchlistsSnapshot.val();
                            const movieLists = [];

                            for (const key of Object.keys(data)) {
                                if (data[key].type === 'movies') {
                                    movieLists.push({
                                        id: key,
                                        ...data[key]
                                    });

                                    // Check items in this custom list
                                    if (data[key].items) {
                                        Object.values(data[key].items).forEach((movie) => {
                                            if (movie.movieid) {
                                                addedMoviesData[movie.movieid] = true;
                                            }
                                        });
                                    }
                                }
                            }
                            setCustomWatchlists(movieLists);
                        }
                    } catch (error) {
                        console.error('Error fetching custom watchlists:', error);
                    }

                    setAddedMovies(addedMoviesData);
                }
            } else {
                setUid(null);
            }
        });
        return () => unsubscribe();
    }, []);

    // Load profiles from Firebase
    useEffect(() => {
        const loadProfiles = async () => {
            if (!uid) return;

            try {
                const profilesRef = ref(db, `users/${uid}/movienyte/profiles`);
                const snapshot = await get(profilesRef);
                if (snapshot.exists()) {
                    const profilesData = snapshot.val();
                    const profilesArray = Object.keys(profilesData).map(key => ({
                        id: key,
                        enabled: profilesData[key].enabled !== undefined ? profilesData[key].enabled : true,
                        ...profilesData[key]
                    }));
                    if (profilesArray.length > 0) {
                        setPeople(profilesArray);
                    }
                }
            } catch (error) {
                console.error('Error loading profiles:', error);
            }
        };

        if (uid) {
            loadProfiles();
        }
    }, [uid]);

    // Save profiles to Firebase
    const saveProfilesToFirebase = async (profiles) => {
        if (!uid) return;

        try {
            const profilesRef = ref(db, `users/${uid}/movienyte/profiles`);
            const profilesObject = {};
            profiles.forEach((profile, index) => {
                profilesObject[profile.id] = {
                    name: profile.name,
                    enabled: profile.enabled !== undefined ? profile.enabled : true,
                    preferences: profile.preferences
                };
            });
            await set(profilesRef, profilesObject);
        } catch (error) {
            console.error('Error saving profiles:', error);
        }
    };

    const addPerson = async () => {
        const newId = Date.now().toString(); // Use timestamp as unique ID
        const newPerson = {
            id: newId,
            name: `Person ${people.length + 1}`,
            enabled: true,
            preferences: { ...initialPersonState.preferences }
        };
        const updatedPeople = [...people, newPerson];
        setPeople(updatedPeople);
        await saveProfilesToFirebase(updatedPeople);
    };

    const deletePerson = async (index) => {
        const personToDelete = people[index];
        const newPeople = people.filter((_, i) => i !== index);
        setPeople(newPeople);

        // Remove from Firebase
        if (uid && personToDelete.id) {
            try {
                const profileRef = ref(db, `users/${uid}/movienyte/profiles/${personToDelete.id}`);
                await remove(profileRef);
            } catch (error) {
                console.error('Error deleting profile:', error);
            }
        }

        await saveProfilesToFirebase(newPeople);
    };

    const toggleProfileEnabled = async (index) => {
        const updatedPeople = [...people];
        updatedPeople[index].enabled = !updatedPeople[index].enabled;
        setPeople(updatedPeople);
        await saveProfilesToFirebase(updatedPeople);
    };

    const handlePreferenceChange = (event) => {
        const { name, value, checked } = event.target;
        const updatedTempPreferences = { ...tempPreferences };

        if (name === 'rating' || name === 'genre') {
            updatedTempPreferences[name] = checked
                ? [...tempPreferences[name], value]
                : tempPreferences[name].filter(item => item !== value);
        } else {
            updatedTempPreferences[name] = value;
        }
        setTempPreferences(updatedTempPreferences);
    };

    const handleCloseModal = () => {
        setCurrentPerson(null);
        setCustomName("");
        setTempPreferences({
            genre: [],
            rating: [],
            year: '',
            runtime: '',
            country: 'US'
        });
    };

    const handleSavePreferences = async () => {
        if (currentPerson !== null) {
            const updatedPeople = [...people];
            updatedPeople[currentPerson] = {
                ...updatedPeople[currentPerson],
                name: customName, // Update name here
                preferences: { ...tempPreferences }
            };
            setPeople(updatedPeople);
            await saveProfilesToFirebase(updatedPeople);
        }
        handleCloseModal();
    };

    const handleNameChange = (event) => {
        setCustomName(event.target.value);
    };

    useEffect(() => {
        if (currentPerson !== null && people[currentPerson]) {
            setCustomName(people[currentPerson].name); // Set initial value for custom name input
            setTempPreferences({ ...people[currentPerson].preferences }); // Set initial value for preferences
        }
    }, [currentPerson, people]);

    // Fetch age ratings for recommended movies and filter by selected ratings
    useEffect(() => {
        const fetchRatings = async () => {
            // Get movies that don't have ratings yet
            const moviesToFetch = recommendedMovies.filter(m => !movieRatings[m.id]);
            if (moviesToFetch.length === 0) {
                // If no new movies to fetch, just filter existing ones
                filterMoviesByRatings(recommendedMovies, movieRatings);
                return;
            }

            const newRatings = { ...movieRatings };

            // Fetch ratings in parallel (batch of 5 at a time to avoid rate limiting)
            for (let i = 0; i < moviesToFetch.length; i += 5) {
                const batch = moviesToFetch.slice(i, i + 5);
                const promises = batch.map(async (movie) => {
                    try {
                        const response = await axios.get(
                            `https://api.themoviedb.org/3/movie/${movie.id}/release_dates`,
                            { params: { api_key: process.env.REACT_APP_API_KEY } }
                        );
                        const usRelease = response.data.results.find(r => r.iso_3166_1 === 'US');
                        if (usRelease) {
                            const certification = usRelease.release_dates.find(rd => rd.certification)?.certification;
                            return { id: movie.id, rating: certification || 'NR' };
                        }
                        return { id: movie.id, rating: 'NR' };
                    } catch {
                        return { id: movie.id, rating: 'NR' };
                    }
                });

                const results = await Promise.all(promises);
                results.forEach(r => { newRatings[r.id] = r.rating; });
            }

            setMovieRatings(newRatings);
            // Filter movies after ratings are updated
            filterMoviesByRatings(recommendedMovies, newRatings);
        };

        const filterMoviesByRatings = (movies, ratings) => {
            // Filter to only enabled profiles
            const enabledPeople = people.filter(p => p.enabled !== false);

            // Get all selected ratings from all enabled people
            const selectedRatings = [...new Set(enabledPeople.flatMap(p => p.preferences.rating))];

            // Get each enabled person's selected genre IDs
            const peopleGenreIds = enabledPeople.map(p => {
                const personGenres = p.preferences.genre || [];
                return personGenres.map(name => genres.find(g => g.name === name)?.id).filter(Boolean);
            });

            // Filter movies by ratings and genres
            const filtered = movies.filter(movie => {
                // Check rating filter
                const movieRating = ratings[movie.id];
                const ratingMatch = selectedRatings.length === 0 || (movieRating && selectedRatings.includes(movieRating));

                if (!ratingMatch) return false;

                // Check if animated movies should be excluded
                if (excludeAnimated) {
                    const movieGenreIds = movie.genre_ids || [];
                    const animationGenreId = 16; // TMDB Animation genre ID
                    if (movieGenreIds.includes(animationGenreId)) {
                        return false;
                    }
                }

                // Check genre filter - ALL people must have at least one genre matching the movie
                if (peopleGenreIds.length === 0) return true; // No genre preferences, show all

                const movieGenreIds = movie.genre_ids || [];

                // Check if every person has at least one genre that matches the movie
                const allPeopleHaveMatchingGenre = peopleGenreIds.every(personGenres => {
                    // If person has no genres selected, skip them (show all)
                    if (personGenres.length === 0) return true;
                    // Check if person has at least one genre that matches movie
                    return personGenres.some(genreId => movieGenreIds.includes(genreId));
                });

                return allPeopleHaveMatchingGenre;
            });

            setFilteredMovies(filtered);
            if (filtered.length === 0 && movies.length > 0) {
                setSearchMessage("No movies found matching the selected ratings and genres. Try selecting different preferences!");
            } else if (filtered.length > 0) {
                setSearchMessage(`Found ${filtered.length} movies matching your selected preferences!`);
            } else if (movies.length === 0) {
                setSearchMessage("No movies found matching everyone's preferences. Try loosening some restrictions!");
            }
        };

        if (recommendedMovies.length > 0) {
            fetchRatings();
        }
    }, [recommendedMovies, movieRatings, people, excludeAnimated, genres]); // eslint-disable-line react-hooks/exhaustive-deps

    const findMovies = async () => {
        setIsSearching(true);
        setSearchMessage("Finding movies for everyone...");
        setRecommendedMovies([]);
        setFilteredMovies([]);
        setCurrentPage(1);
        setTotalPages(0);

        try {
            // Filter to only enabled profiles
            const enabledPeople = people.filter(p => p.enabled !== false);

            if (enabledPeople.length === 0) {
                setSearchMessage("No enabled profiles. Please enable at least one profile to search for movies.");
                setIsSearching(false);
                return;
            }

            // 1. Combine genres (union - any genre that anyone picked, for more results)
            const allGenres = [...new Set(enabledPeople.flatMap(p => p.preferences.genre))];
            const genreIds = allGenres.map(name =>
                genres.find(g => g.name === name)?.id
            ).filter(Boolean);

            // 2. Age rating - find most restrictive rating that everyone can watch
            const ratingOrder = ['G', 'PG', 'PG-13', 'R'];
            const allRatings = enabledPeople.flatMap(p => p.preferences.rating);
            let maxRating = 'R'; // Default to R if no preferences
            if (allRatings.length > 0) {
                // Find the lowest rated content anyone is willing to watch as the max
                const uniqueRatings = [...new Set(allRatings)];
                const indices = uniqueRatings.map(r => ratingOrder.indexOf(r)).filter(i => i >= 0);
                if (indices.length > 0) {
                    // Get the highest rating that appears in everyone's preferences (if they set any)
                    const peopleWithRatings = enabledPeople.filter(p => p.preferences.rating.length > 0);
                    if (peopleWithRatings.length > 0) {
                        // Find common ratings
                        let commonRatings = [...ratingOrder];
                        peopleWithRatings.forEach(p => {
                            commonRatings = commonRatings.filter(r => p.preferences.rating.includes(r));
                        });
                        if (commonRatings.length > 0) {
                            // Use the highest common rating
                            maxRating = commonRatings[commonRatings.length - 1];
                        } else {
                            // No common ratings, use the most restrictive
                            const minIndex = Math.min(...peopleWithRatings.map(p =>
                                Math.max(...p.preferences.rating.map(r => ratingOrder.indexOf(r)))
                            ));
                            maxRating = ratingOrder[minIndex];
                        }
                    }
                }
            }

            // 3. Min release year - use highest (most recent requirement)
            const years = enabledPeople.map(p => parseInt(p.preferences.year)).filter(y => !isNaN(y) && y > 0);
            const minYear = years.length > 0 ? Math.max(...years) : null;

            // 4. Max runtime - use lowest (shortest requirement), convert hours to minutes
            const runtimes = enabledPeople.map(p => parseFloat(p.preferences.runtime) * 60).filter(r => !isNaN(r) && r > 0);
            const maxRuntime = runtimes.length > 0 ? Math.min(...runtimes) : null;

            // 5. Country of origin - combine all selected countries (union for more results)
            const allCountries = [...new Set(enabledPeople.map(p => p.preferences.country).filter(c => c && c !== ''))];

            // 6. Build API params
            const params = {
                api_key: process.env.REACT_APP_API_KEY,
                sort_by: 'vote_average.desc',
                'vote_count.gte': 100, // Ensure quality results with enough votes
                certification_country: 'US',
            };

            // Only add filters if they have values
            if (genreIds.length > 0) params.with_genres = genreIds.join('|'); // Using | for OR (any genre)
            if (maxRating !== 'R') params['certification.lte'] = maxRating;
            if (minYear) params['primary_release_date.gte'] = `${minYear}-01-01`;
            if (maxRuntime) params['with_runtime.lte'] = Math.round(maxRuntime);
            if (allCountries.length > 0) params.with_origin_country = allCountries.join('|'); // Using | for OR (any country)

            // Save params for load more
            setSearchParams(params);

            // 7. Call API
            const response = await axios.get('https://api.themoviedb.org/3/discover/movie', {
                params: { ...params, page: 1 }
            });

            setTotalPages(response.data.total_pages);

            if (response.data.results.length === 0) {
                setSearchMessage("No movies found matching everyone's preferences. Try loosening some restrictions!");
            } else {
                setSearchMessage("Fetching movie ratings and filtering...");
            }
            setRecommendedMovies(response.data.results);
        } catch (error) {
            console.error('Error finding movies:', error);
            setSearchMessage("Error finding movies. Please try again.");
        }

        setIsSearching(false);
    };

    const loadMoreMovies = async () => {
        if (!searchParams || currentPage >= totalPages) return;

        setIsLoadingMore(true);
        const nextPage = currentPage + 1;

        try {
            const response = await axios.get('https://api.themoviedb.org/3/discover/movie', {
                params: { ...searchParams, page: nextPage }
            });

            setRecommendedMovies(prev => [...prev, ...response.data.results]);
            setCurrentPage(nextPage);
        } catch (error) {
            console.error('Error loading more movies:', error);
        }

        setIsLoadingMore(false);
    };

    const handleAddMovie = async (movie, listId = null) => {
        //Getting general movie details
        const detailsResponse = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${process.env.REACT_APP_API_KEY}`);
        if (!detailsResponse.ok) {
            throw new Error('Failed to fetch movie details');
        }
        const movieDetails = await detailsResponse.json();
        const genreString = movieDetails.genres
            .map(genre => genre.name)
            .join(' / ');

        //Getting age rating
        const ratingResponse = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/release_dates?api_key=${process.env.REACT_APP_API_KEY}`);
        if (!ratingResponse.ok) {
            throw new Error('Failed to fetch movie details');
        }
        const movieRating = await ratingResponse.json();
        let certificationForUS = null;
        const results = movieRating.results;
        for (const result of results) {
            if (result.iso_3166_1 === "US") {
                const releaseDates = result.release_dates;
                for (const releaseDate of releaseDates) {
                    if (releaseDate.certification) {
                        certificationForUS = releaseDate.certification;
                        break;
                    }
                }
                break;
            }
        }

        //Getting streaming providers
        const providersResponse = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/watch/providers?api_key=${process.env.REACT_APP_API_KEY}`);
        if (!providersResponse.ok) {
            throw new Error('Failed to fetch movie details');
        }
        const movieProviders = await providersResponse.json();
        let providerNames = [];
        if (movieProviders.results.US && movieProviders.results.US.flatrate) {
            const flatrateProviders = movieProviders.results.US.flatrate;
            providerNames = flatrateProviders.map(provider => provider.provider_name);
        }

        //Getting imdb id from tmdb id
        const imdbResponse = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/external_ids?api_key=${process.env.REACT_APP_API_KEY}`);
        if (!imdbResponse.ok) {
            throw new Error('Failed to fetch movie details');
        }
        const imdbData = await imdbResponse.json();
        const imdbId = imdbData.imdb_id;

        //Saving movie to user's database
        const uid = auth.currentUser?.uid;
        if (uid) {
            // Determine the path based on whether it's a custom list or default
            const listPath = listId
                ? `users/${uid}/customwatchlists/${listId}/items`
                : `users/${uid}/defaultwatchlists/movies/items`;
            const userMovieListRef = ref(db, listPath);
            push(userMovieListRef, {
                movietitle: movie.title,
                movieid: movie.id,
                watched: false,
                runtime: movieDetails.runtime,
                providers: providerNames,
                agerating: certificationForUS,
                voteaverage: movie.vote_average,
                genres: genreString,
                releaseyear: movieDetails.release_date?.substring(0, 4) || '',
                imdbid: imdbId,
                poster_path: movie.poster_path || ''
            })
                .then(() => {
                    console.log('Movie added successfully!');
                    setAddedMovies({ ...addedMovies, [movie.id]: true });
                })
                .catch((error) => {
                    console.error('Error adding movie:', error);
                });
        } else {
            console.error('User is not signed in!');
        }
    };

    return (
        <div>
            <Navbar />
            <div className="container-fluid pb-5">
                <div className="modern-section">
                    <div className="p-4">
                        <header className="text-center mb-5">
                            <h1 className="hero-title text-dark dark-mode-text-white mb-2">MovieNyte™</h1>
                            <p className="text-muted">The ultimate group decision maker for your next cinema session.</p>
                        </header>

                        <div className="mn-profile-grid">
                            {people?.map((person, index) => (
                                <div key={person.id || index} className="mn-profile-card shadow-sm">
                                    <div className="mn-profile-header">
                                        <div className="d-flex align-items-center gap-2">
                                            <h3 className="mn-profile-name">{person.name}</h3>
                                            <span className={`mn-status-badge ${person.enabled !== false ? 'mn-status-enabled' : 'mn-status-disabled'}`}>
                                                {person.enabled !== false ? 'Active' : 'Idle'}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            className="mn-delete-btn"
                                            onClick={() => deletePerson(index)}
                                            title="Remove Profile"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="mn-pref-group">
                                        <label className="mn-pref-label">Favorite Genres</label>
                                        <div className="mn-pref-pills">
                                            {person.preferences.genre.length > 0 ? (
                                                person.preferences.genre.map((g, i) => <span key={i} className="mn-pill">{g}</span>)
                                            ) : (
                                                <span className="mn-pill empty">Any Genre</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mn-pref-group">
                                        <label className="mn-pref-label">Age Restrictions</label>
                                        <div className="mn-pref-pills">
                                            {person.preferences.rating.length > 0 ? (
                                                person.preferences.rating.map((r, i) => <span key={i} className="mn-pill">{r}</span>)
                                            ) : (
                                                <span className="mn-pill empty">No restrictions</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="row g-2 mt-auto">
                                        <div className="col-6">
                                            <div className="mn-pref-group mb-0">
                                                <label className="mn-pref-label">Min Year</label>
                                                <span className="mn-pill d-block text-center">{person.preferences.year || 'Any'}</span>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="mn-pref-group mb-0">
                                                <label className="mn-pref-label">Max Runtime</label>
                                                <span className="mn-pill d-block text-center">{person.preferences.runtime ? `${person.preferences.runtime}h` : 'Any'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="d-flex align-items-center gap-2 mt-4">
                                        <button
                                            type="button"
                                            className="btn btn-outline-primary mn-edit-btn"
                                            data-bs-toggle="modal"
                                            data-bs-target="#staticBackdrop"
                                            onClick={() => setCurrentPerson(index)}
                                        >
                                            Edit Preferences
                                        </button>
                                        <div className="form-check form-switch mb-0">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id={`enable-${index}`}
                                                checked={person.enabled !== false}
                                                onChange={() => toggleProfileEnabled(index)}
                                                style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mn-action-bar shadow-lg">
                            <button className="btn btn-premium btn-premium-outline py-2" onClick={addPerson}>+ New Profile</button>
                            <button
                                className="btn btn-premium btn-premium-primary py-2 px-4 flex-grow-1"
                                onClick={findMovies}
                                disabled={isSearching || people.length === 0}
                            >
                                {isSearching ? "Searching..." : "🎬 Sync & Find Movies"}
                            </button>
                            <div className="form-check form-switch ms-3">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="excludeAnimated"
                                    checked={excludeAnimated}
                                    onChange={(e) => setExcludeAnimated(e.target.checked)}
                                />
                                <label className="form-check-label small fw-bold" htmlFor="excludeAnimated">
                                    No Animation
                                </label>
                            </div>
                        </div>

                        {searchMessage && (
                            <div className={`alert ${filteredMovies.length > 0 ? 'alert-success' : 'alert-info'} rounded-4 border-0 shadow-sm animate-fade-in`}>
                                <div className="d-flex align-items-center gap-2">
                                    <span className="fs-4" role="img" aria-label="icon">{filteredMovies.length > 0 ? '✨' : 'ℹ️'}</span>
                                    <span className="fw-medium">{searchMessage}</span>
                                </div>
                            </div>
                        )}

                        {(filteredMovies.length > 0 || isSearching) && (
                            <div className="mt-5 animate-slide-up">
                                <div className="d-flex align-items-center justify-content-between mb-4">
                                    <h3 className="mn-profile-name">Recommended for Your Group</h3>
                                    <span className="badge bg-primary rounded-pill">{filteredMovies.length} Results</span>
                                </div>
                                <MovieCardGrid
                                    key={isSearching ? "loading" : "results"}
                                    movies={filteredMovies}
                                    genres={genres}
                                    movieRatings={movieRatings}
                                    addedMovies={addedMovies}
                                    customWatchlists={customWatchlists}
                                    handleAddMovie={handleAddMovie}
                                    loading={isSearching}
                                />

                                {currentPage < totalPages && (
                                    <div className="text-center mt-5">
                                        <button
                                            className="btn btn-premium btn-premium-outline px-5"
                                            onClick={loadMoreMovies}
                                            disabled={isLoadingMore}
                                        >
                                            {isLoadingMore ? "Loading more..." : "Load More Options"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h1 className="modal-title fs-5" id="staticBackdropLabel">{`Edit Preferences for ${customName}`}</h1>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={handleCloseModal}></button>
                        </div>
                        <div className="modal-body">
                            <form>
                                <div className="form-group mb-4">
                                    <label className="fw-bold mb-2">Person's Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Enter person's name"
                                        value={customName}
                                        onChange={handleNameChange}
                                    />
                                </div>
                                <div className="form-group mb-4">
                                    <label className="fw-bold mb-2">Genres</label>
                                    <div className="d-flex flex-wrap gap-2">
                                        {genres?.map(genre => (
                                            <div
                                                key={genre.id}
                                                onClick={() => handlePreferenceChange({ target: { name: 'genre', value: genre.name, checked: !tempPreferences.genre.includes(genre.name) } })}
                                                className={`px-3 py-1 rounded-pill border ${tempPreferences.genre.includes(genre.name) ? 'bg-primary text-white border-primary' : 'bg-light border-secondary'}`}
                                                style={{ cursor: 'pointer', userSelect: 'none' }}
                                            >
                                                {genre.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="form-group mb-4">
                                    <label className="fw-bold mb-2">Age Rating</label>
                                    <div className="d-flex gap-2">
                                        {['G', 'PG', 'PG-13', 'R', 'NR'].map(rating => (
                                            <div
                                                key={rating}
                                                onClick={() => handlePreferenceChange({ target: { name: 'rating', value: rating, checked: !tempPreferences.rating.includes(rating) } })}
                                                className={`px-3 py-1 rounded-pill border ${tempPreferences.rating.includes(rating) ? 'bg-primary text-white border-primary' : 'bg-light border-secondary'}`}
                                                style={{ cursor: 'pointer', userSelect: 'none' }}
                                            >
                                                {rating}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="form-group mb-4">
                                    <label className="fw-bold mb-2">Min. Release Year</label>
                                    <input type="number" className="form-control" name="year" value={tempPreferences.year} onChange={handlePreferenceChange} />
                                </div>
                                <div className="form-group mb-4">
                                    <label className="fw-bold mb-2">Runtime (hrs)</label>
                                    <input type="number" className="form-control" name="runtime" value={tempPreferences.runtime} onChange={handlePreferenceChange} />
                                </div>
                                <div className="form-group mb-4">
                                    <label className="fw-bold mb-2">Country of Origin</label>
                                    <select
                                        className="form-control"
                                        name="country"
                                        value={tempPreferences.country}
                                        onChange={handlePreferenceChange}
                                    >
                                        <option value="">Any Country</option>
                                        {countries.map(country => (
                                            <option key={country.iso_3166_1} value={country.iso_3166_1}>
                                                {country.english_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal" onClick={handleCloseModal}>Close</button>
                            <button type="button" className="btn btn-primary" data-bs-dismiss="modal" onClick={handleSavePreferences}>Save changes</button>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default MovieNyte;
