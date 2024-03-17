import { Outlet, Link } from "react-router-dom";

const Anime = () => {
    return (
        <>
            <h1>ViewVault</h1>

            <nav class="nav nav-pills nav-fill">
                <a class="nav-item nav-link" href="/movies">Movies</a>
                <a class="nav-item nav-link" href="/tvshows">TV Shows</a>
                <a class="nav-item nav-link active" href="/anime">Anime</a>
                <a class="nav-item nav-link" href="/manga">Manga</a>
            </nav>
        </>
    )
};

export default Anime;