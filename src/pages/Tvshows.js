import { Outlet, Link } from "react-router-dom";

const Tvshows = () => {
    return (
        <>
            <h1>ViewVault</h1>

            <nav class="nav nav-pills nav-fill">
                <a class="nav-item nav-link" href="/movies">Movies</a>
                <a class="nav-item nav-link active" href="/tvshows">TV Shows</a>
                <a class="nav-item nav-link" href="/anime">Anime</a>
                <a class="nav-item nav-link" href="/manga">Manga</a>
            </nav>
        </>
    )
};

export default Tvshows;