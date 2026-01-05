const Sidebar = () => {
    return (
        <div className="text-center col-lg-2 col-md-3 col-sm-11 border m-5 rounded shadow p-4">
            <ul className="nav flex-column">
                <li className="nav-item">
                    <h4 className="">Watchlists</h4>
                </li>
                <li className="nav-item">
                    <a className="nav-link text-muted" href="/movies">Movies</a>
                </li>
                <li className="nav-item">
                    <a className="nav-link text-muted" href="/tvshows">TV Shows</a>
                </li>
            </ul>
        </div>
    )
};

export default Sidebar;