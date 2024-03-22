import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import { auth, db } from "../utils/firebase"
import { ref, get, remove, update } from "firebase/database";
import Sidebar from "./Sidebar";

const Manga = () => {
    const [mangas, setMangas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uid, setUid] = useState(null);
    const [sortBy, setSortBy] = useState("Default");

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                const uid = user.uid;
                setUid(uid);
                fetchManga(uid);
            } else {
                setUid(null);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const fetchManga = async (uid) => {
        try {
            const mangasRef = ref(db, `users/${uid}/mangalist`);
            const snapshot = await get(mangasRef);
            if (snapshot.exists()) {
                const mangaData = snapshot.val();
                const mangaArray = Object.keys(mangaData).map((key) => ({
                    id: key,
                    mangaid: mangaData[key].mangaid,
                    name: mangaData[key].mangatitle,
                    watched: mangaData[key].watched,
                    chapters: mangaData[key].chapters,
                    rating: mangaData[key].rating
                }));
                setMangas(mangaArray);
            } else {
                console.log("No manga available");
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching manga:', error);
        }
    };

    const handleRemoveManga = (mangaId) => {
        const mangaRef = ref(db, `users/${uid}/mangalist/${mangaId}`);
        remove(mangaRef)
            .then(() => {
                console.log('Manga removed successfully!');
                setMangas(mangas.filter(manga => manga.id !== mangaId));
            })
            .catch((error) => {
                console.error('Error removing manga:', error);
            });
    };

    const handleToggleWatched = async (mangaId, watched) => {
        try {
            const mangaRef = ref(db, `users/${uid}/mangalist/${mangaId}`);
            await update(mangaRef, { watched: !watched });
            setMangas(mangas.map(manga => {
                if (manga.id === mangaId) {
                    return { ...manga, watched: !watched };
                }
                return manga;
            }));
        } catch (error) {
            console.error('Error updating watched status:', error);
        }
    };

    const handleSortBy = (value) => {
        setSortBy(value);
        if (value === "To Read") {
            const sortedMangas = mangas.slice().sort((a, b) => {
                return a.watched - b.watched;
            });
            setMangas(sortedMangas);
        } else if (value === "Read") {
            const sortedMangas = mangas.slice().sort((a, b) => {
                return b.watched - a.watched;
            });
            setMangas(sortedMangas);
        } else {
            fetchManga(uid);
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

    const toMangaDex = (mangaName) => {
        const formattedMangaName = mangaName.replace(/ /g, '+');
        const mangadexUrl = `https://mangadex.org/search?q=${formattedMangaName}`;
        window.open(mangadexUrl, '_blank');
    };

    return (
        <div className="">
            <Navbar />
            <div className="container-fluid">
                <div className="container">
                    <div className="p-4">
                        <h1 className="text-center m-4 fw-bold">Manga List</h1>
                        <div className="pt-2 pb-4">
                            <div className="dropdown mb-2 d-flex justify-content-between">
                                <button className="btn btn-outline-secondary dropdown-toggle" type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
                                    {sortBy}
                                </button>
                                <ul className="dropdown-menu dropdown-menu-dark" aria-labelledby="dropdownMenuButton1">
                                    <li><button className="dropdown-item" onClick={() => handleSortBy("To Read")}>To Read</button></li>
                                    <li><button className="dropdown-item" onClick={() => handleSortBy("Read")}>Read</button></li>
                                    <li><button className="dropdown-item" onClick={() => handleSortBy("Default")}>Default</button></li>
                                </ul>
                                <a className="btn btn-primary" href="./searchmanga">Add Manga</a>
                            </div>
                            <div className="list-group list-group-light">
                                {mangas.map((manga) => (
                                    <li key={manga.id} className="list-group-item rounded mb-2 mt-2 shadow p-3 bg-white d-flex justify-content-between align-items-center">
                                        <div className="form-check">
                                            <input className="form-check-input" type="checkbox" value={manga.watched} id={`checkboxExample${manga.id}`} checked={manga.watched} onChange={() => handleToggleWatched(manga.id, manga.watched)} />
                                            <label className="form-check-label ml-2 fw-bold" htmlFor={`checkboxExample${manga.id}`}>{manga.name}</label>
                                            <div className="d-flex align-items-center">
                                                <span className={`m-1 badge rounded-pill ${getBackgroundColor(manga.rating)}`}>{(manga.rating * 10).toFixed(2)}%</span>
                                                {' '}
                                                <span className="m-1 badge bg-light text-dark border border-danger">{manga.agerating}</span>
                                                {' '}
                                                <span className="m-1 fst-italic">{manga.chapters} chapters</span>
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center justify-content-between">
                                            <div className="btn-group dropstart m-2">
                                                <button type="button" className="btn btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">≡</button>
                                                <ul className="dropdown-menu">
                                                    {/* <li><button className="dropdown-item" onClick={() => { toComponentB(movie) }}>More like this</button></li> */}
                                                    <li><button className="dropdown-item" onClick={() => { toMangaDex(manga.name) }}>Read on MangaDex</button></li>
                                                    {/* <li><button className="dropdown-item" onClick={() => { toLookmovie(movie.name) }}>Stream on Lookmovie</button></li> */}
                                                </ul>
                                            </div>
                                            <button className="btn btn-outline-danger" onClick={() => handleRemoveManga(manga.id)}>X</button>
                                        </div>
                                    </li>
                                ))}
                            </div>
                        </div>
                        <div className="text-center mb-5 ">
                            <a className="btn btn-primary" href="./searchmanga">Add Manga</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default Manga;