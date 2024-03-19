import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import { auth, db } from "../utils/firebase"
import { ref, push, get } from "firebase/database";

const SearchAnime = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [addedShows, setAddedShows] = useState({});
    const [uid, setUid] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                const uid = user.uid;
                setUid(uid);
                if (uid) {
                    const userShowListRef = ref(db, `users/${uid}/animelist`);
                    get(userShowListRef).then((snapshot) => {
                        if (snapshot.exists()) {
                            const showsData = snapshot.val();
                            const showIds = Object.values(showsData).map((tvshow) => tvshow.tvshowid);
                            const addedShowsData = {};
                            showIds.forEach((showId) => {
                                addedShowsData[showId] = true;
                            });
                            setAddedShows(addedShowsData);
                        }
                    }).catch((error) => {
                        console.error('Error fetching user anime:', error);
                    });
                }
            } else {
                setUid(null);
            }
        });
        return () => unsubscribe();
    }, []);

    const searchTV = async () => {
        try {
            const response = await axios.get(`https://api.themoviedb.org/3/search/tv`, {
                params: {
                    api_key: `${process.env.REACT_APP_API_KEY}`,
                    query: searchQuery
                }
            });
            const results = response.data.results;
            setSearchResults(results);
        } catch (error) {
            console.error('Error fetching anime:', error);
        }
    };

    const handleSearch = () => {
        searchTV();
    };


    const handleAddShow = async (tvshow) => {
        //Getting general tv show details
        const detailsResponse = await fetch(`https://api.themoviedb.org/3/tv/${tvshow.id}?api_key=${process.env.REACT_APP_API_KEY}`);
        if (!detailsResponse.ok) {
            throw new Error('Failed to fetch anime details');
        }
        const showDetails = await detailsResponse.json();
        console.log(showDetails)

        //Getting age rating
        const ratingResponse = await fetch(`https://api.themoviedb.org/3/tv/${tvshow.id}/content_ratings?api_key=${process.env.REACT_APP_API_KEY}`);
        if (!ratingResponse.ok) {
            throw new Error('Failed to fetch anime details');
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
            throw new Error('Failed to fetch anime details');
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
            const userShowListRef = ref(db, `users/${uid}/animelist`);
            push(userShowListRef, {
                tvshowtitle: tvshow.name,
                tvshowid: tvshow.id,
                watched: false,
                providers: providerNames,
                agerating: certificationForUS,
                voteaverage: tvshow.vote_average,
                numepisodes: showDetails.number_of_episodes
            })
                .then(() => {
                    console.log('anime added successfully!');
                    setAddedShows({ ...addedShows, [tvshow.id]: true });
                })
                .catch((error) => {
                    console.error('Error adding anime:', error);
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

    const getBackgroundColor = (voteAverage) => {
        if (voteAverage * 10 >= 70) {
            return "bg-success";
        } else if (voteAverage * 10 >= 50) {
            return "bg-warning text-dark";
        } else {
            return "bg-danger";
        }
    };


    return (
        <div className="">
            <Navbar></Navbar>
            <div className="container">
                <h1 className="text-center p-5 fw-bold">Find Anime</h1>
                <div className="input-group p-3 bg-white">
                    <input type="text" className="form-control" placeholder="Search for an anime..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleKeyDown} />
                    <div className="input-group-append">
                        <button className="btn btn-primary" type="button" onClick={handleSearch}>Search</button>
                    </div>
                </div>

                <ul className="list-group mt-4">
                    {searchResults.map((tvshow) => (

                        <li key={tvshow.id} className="list-group-item rounded mb-2 shadow p-3 bg-white d-flex justify-content-between align-items-center">
                            <div className="">
                                <p className="fw-bold">{tvshow.name}
                                    <span className="m-1 fw-light">({tvshow.first_air_date.substring(0, 4)})</span>
                                    <span className={`m-1 badge rounded-pill ${getBackgroundColor(tvshow.vote_average)}`}>{(tvshow.vote_average * 10).toFixed(2)}%</span> </p>
                                <p className="fw-normal">{tvshow.overview}</p>
                            </div>
                            {addedShows[tvshow.id] ? (
                                <button className="btn btn-success me-2" type="button">✓</button>
                            ) : (
                                <button className="btn btn-primary me-2" type="button" onClick={() => { handleAddShow(tvshow) }}>+</button>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default SearchAnime;