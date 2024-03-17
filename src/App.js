import './App.css';
import Navbar from './pages/Navbar';

function App() {
  return (
    <div className="App">
      <Navbar></Navbar>
      <h1>ViewVault</h1>
      <nav class="nav nav-pills nav-fill">
        <a class="nav-item nav-link" href="/movies">Movies</a>
        <a class="nav-item nav-link" href="/tvshows">TV Shows</a>
        <a class="nav-item nav-link" href="/anime">Anime</a>
        <a class="nav-item nav-link" href="/manga">Manga</a>
      </nav>

      <h1>About ViewVault</h1>
    </div>
  );
}

export default App;
