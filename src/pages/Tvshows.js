import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import { auth, db } from "../utils/firebase"
import { ref, get, remove, update } from "firebase/database";
import { useNavigate } from 'react-router-dom';
import Footer from "./Footer";


const Tvshows = () => {
    const [shows, setShows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uid, setUid] = useState(null);
    const [sortBy, setSortBy] = useState("Default");

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                const uid = user.uid;
                setUid(uid);
                fetchShows(uid);
            } else {
                setUid(null);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const fetchShows = async (uid) => {
        try {
            const showsRef = ref(db, `users/${uid}/tvlist`);
            const snapshot = await get(showsRef);
            if (snapshot.exists()) {
                const showsData = snapshot.val();
                const showsArray = Object.keys(showsData).map((key) => ({
                    id: key,
                    tvshowid: showsData[key].tvshowid,
                    title: showsData[key].tvshowtitle,
                    watched: showsData[key].watched,
                    providers: showsData[key].providers,
                    agerating: showsData[key].agerating,
                    vote_average: showsData[key].voteaverage,
                    num_episodes: showsData[key].numepisodes
                }));
                setShows(showsArray);
            } else {
                console.log("No shows available");
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching shows:', error);
        }
    };

    const handleRemoveShow = (tvshowId) => {
        const showRef = ref(db, `users/${uid}/tvlist/${tvshowId}`);
        remove(showRef)
            .then(() => {
                console.log('TV Show removed successfully!');
                setShows(shows.filter(show => show.id !== tvshowId));
            })
            .catch((error) => {
                console.error('Error removing show:', error);
            });
    };

    const handleToggleWatched = async (tvshowId, watched) => {
        try {
            const showRef = ref(db, `users/${uid}/tvlist/${tvshowId}`);
            await update(showRef, { watched: !watched });
            setShows(shows.map(show => {
                if (show.id === tvshowId) {
                    return { ...show, watched: !watched };
                }
                return show;
            }));
        } catch (error) {
            console.error('Error updating watched status:', error);
        }
    };

    const handleSortBy = (value) => {
        setSortBy(value);
        if (value === "To Watch") {
            const sortedShows = shows.slice().sort((a, b) => {
                return a.watched - b.watched;
            });
            setShows(sortedShows);
        } else if (value === "Watched") {
            const sortedShows = shows.slice().sort((a, b) => {
                return b.watched - a.watched;
            });
            setShows(sortedShows);
        }
        else if (value === "Episodes") {
            const sortedShows = shows.slice().sort((a, b) => {
                return a.num_episodes - b.num_episodes;
            });
            setShows(sortedShows);
        } else {
            fetchShows(uid);
        }
    };

    const navigate = useNavigate();

    const toComponentB = (show) => {
        navigate('/recommendedshows', { state: show });
    };

    const toLookmovie = (showName) => {
        const formattedShowName = showName.replace(/ /g, '%20');
        const lookmovieUrl = `https://lookmovie.foundation/shows/search/?q=${formattedShowName}`;
        window.open(lookmovieUrl, '_blank');
    };

    const toDopebox = (showName) => {
        const formattedShowName = showName.replace(/ /g, '-');
        const dopeboxUrl = `https://dopebox.to/search/${formattedShowName}`;
        window.open(dopeboxUrl, '_blank');
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
            <Navbar />
            <div className="container-fluid">
                <div className="container">
                    <div className="p-4">
                        <h1 className="text-center m-4 fw-bold">TV Show Watchlist</h1>
                        <div className="pt-2 pb-4">
                            <div className="dropdown mb-2 d-flex justify-content-between">
                                <button className="btn btn-outline-secondary dropdown-toggle" type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
                                    {sortBy}
                                </button>
                                <ul className="dropdown-menu dropdown-menu-dark" aria-labelledby="dropdownMenuButton1">
                                    <li><button className="dropdown-item" onClick={() => handleSortBy("Default")}>Default</button></li>
                                    <li><button className="dropdown-item" onClick={() => handleSortBy("To Watch")}>To Watch</button></li>
                                    <li><button className="dropdown-item" onClick={() => handleSortBy("Watched")}>Watched</button></li>
                                    <li><button className="dropdown-item" onClick={() => handleSortBy("Episodes")}>Episodes</button></li>
                                </ul>
                                <a className="btn btn-primary" href="./searchtv">Add TV Show</a>
                            </div>
                            <div className="list-group list-group-light">
                                {shows.map((show) => (
                                    <li key={show.id} className="list-group-item rounded mb-2 mt-2 shadow p-3 bg-white d-flex justify-content-between align-items-center">
                                        <div className="form-check">
                                            <input className="form-check-input" type="checkbox" value={show.watched} id={`checkboxExample${show.id}`} checked={show.watched} onChange={() => handleToggleWatched(show.id, show.watched)} />
                                            <label className="form-check-label ml-2 fw-bold" htmlFor={`checkboxExample${show.id}`}>{show.title}</label>
                                            <div className="d-flex align-items-center">
                                                <span className={`m-1 badge rounded-pill ${getBackgroundColor(show.vote_average)}`}>{(show.vote_average * 10).toFixed(2)}%</span>
                                                {' '}
                                                <span className="m-1 badge bg-light text-dark border border-danger">{show.agerating}</span>
                                                {' '}
                                                <span className="m-1 fst-italic">{show.num_episodes} episodes</span>
                                            </div>
                                            {show.providers && show.providers.length > 0 && (
                                                <p>Stream On: {show.providers.join(', ')}</p>
                                            )}
                                        </div>
                                        <div className="d-flex align-items-center justify-content-between">
                                            <div className="btn-group dropstart m-2">
                                                <button type="button" className="btn btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">≡</button>
                                                <ul className="dropdown-menu">
                                                    <li><button className="dropdown-item" onClick={() => { toComponentB(show) }}>More like this</button></li>
                                                    <li><button className="dropdown-item" onClick={() => { toDopebox(show.title) }}>Stream on DopeBox</button></li>
                                                    <li><button className="dropdown-item" onClick={() => { toLookmovie(show.title) }}>Stream on Lookmovie</button></li>
                                                </ul>
                                            </div>
                                            <button className="btn btn-outline-danger" onClick={() => handleRemoveShow(show.id)}>X</button>
                                        </div>
                                    </li>
                                ))}
                            </div>
                        </div>
                        <div className="text-center mb-5 ">
                            <a className="btn btn-primary" href="./searchtv">Add TV Show</a>
                        </div>
                    </div>
                </div>
            </div>
            <Footer></Footer>
        </div>
    )
};

export default Tvshows;