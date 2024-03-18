const Sidebar = () => {
    return (
        <div className="text-center col-lg-2 col-md-3 col-sm-11 position-fixed border m-5 rounded shadow p-4">
            <ul class="nav flex-column">
                <li class="nav-item">
                    <h4 className="">Watchlists</h4>
                </li>
                <li class="nav-item">
                    <a class="nav-link text-muted" href="/movies">Movies</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link text-muted" href="/tvshows">TV Shows</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link text-muted" href="#">Anime</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link text-muted" href="#">Manga</a>
                </li>
            </ul>
        </div>
    )
};

export default Sidebar;