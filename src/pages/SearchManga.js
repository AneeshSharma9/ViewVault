import Navbar from "./Navbar";
import React, { useState, useEffect } from "react";
import axios from 'axios';
import { auth, db } from "../utils/firebase"
import { ref, push, get } from "firebase/database";

const SearchManga = () => {

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [addedManga, setAddedManga] = useState({});
    const [uid, setUid] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                const uid = user.uid;
                setUid(uid);
                if (uid) {
                    const userMangaListRef = ref(db, `users/${uid}/mangalist`);
                    get(userMangaListRef).then((snapshot) => {
                        if (snapshot.exists()) {
                            const mangaData = snapshot.val();
                            const mangaIds = Object.values(mangaData).map((manga) => manga.mangaid);
                            const addedMangaData = {};
                            mangaIds.forEach((movieId) => {
                                addedMangaData[movieId] = true;
                            });
                            setAddedManga(addedMangaData);
                        }
                    }).catch((error) => {
                        console.error('Error fetching user manga:', error);
                    });
                }
            } else {
                setUid(null);
            }
        });
        return () => unsubscribe();
    }, []);

    const searchManga = async () => {
        const baseUrl = 'https://api.mangadex.org';
        const resp = await axios({
            method: 'GET',
            url: `${baseUrl}/manga`,
            params: {
                title: searchQuery
            }
        });
        console.log(resp.data.data)
        setSearchResults(resp.data.data);
    };

    const handleSearch = () => {
        searchManga();
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            searchManga();
        }
    };

    const maxLength = 200;
    const truncateDescription = (description) => {
        if (description.length > maxLength) {
            return description.substring(0, maxLength) + "...";
        } else {
            return description;
        }
    }

    const handleAddManga = async (manga) => {
        //Get manga bayesian ratings
        const baseUrl = 'https://api.mangadex.org';
        const resp = await axios({
            method: 'GET',
            url: `${baseUrl}/statistics/manga/${manga.id}`
        });
        const { rating } = resp.data.statistics[manga.id];
        console.log('Bayesian Rating:', (rating.bayesian).toFixed(2));

        //Saving movie to user's database
        const uid = auth.currentUser.uid;
        if (uid) {
            const userMangaListRef = ref(db, `users/${uid}/mangalist`);
            push(userMangaListRef, {
                mangatitle: manga.attributes.title.en,
                mangaid: manga.id,
                watched: false,
                chapters: manga.attributes.lastChapter,
                rating: (rating.bayesian).toFixed(2)
            })
                .then(() => {
                    console.log('Manga added successfully!');
                    setAddedManga({ ...addedManga, [manga.id]: true });
                })
                .catch((error) => {
                    console.error('Error adding manga:', error);
                });
        } else {
            console.error('User is not signed in!');
        }
    };

    const getBackgroundColor = (status) => {
        if (status === "completed") {
            return "bg-success";
        } else if (status === "ongoing") {
            return "bg-warning text-dark";
        } else {
            return "bg-danger";
        }
    };


    return (
        <div className="">
            <Navbar></Navbar>
            <div className="container">
                <h1 className="text-center p-5 fw-bold">Find Manga</h1>
                <div className="input-group p-3 bg-white">
                    <input type="text" className="form-control" placeholder="Search for a manga..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleKeyDown} />
                    <div className="input-group-append">
                        <button className="btn btn-primary" type="button" onClick={handleSearch}>Search</button>
                    </div>
                </div>

                <ul className="list-group mt-4">
                    {searchResults.map((manga) => (
                        <li key={manga.id} className="list-group-item rounded mb-2 shadow p-3 bg-white d-flex justify-content-between align-items-center">
                            <div className="">
                                <p className="fw-bold">{manga.attributes.title.en}
                                    <span className="fw-light m-1">({manga.attributes.year})</span>
                                    <span className={`fw-normal badge rounded-pill text-capitalize ${getBackgroundColor(manga.attributes.status)}`}>{manga.attributes.status}</span>
                                </p>
                                <p className="fw-normal">{manga.attributes.description.en}</p>
                            </div>
                            {addedManga[manga.id] ? (
                                <button className="btn btn-success me-2" type="button">✓</button>
                            ) : (
                                <button className="btn btn-primary me-2" type="button" onClick={() => { handleAddManga(manga) }}>+</button>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
};

export default SearchManga;