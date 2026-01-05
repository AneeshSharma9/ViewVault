import 'bootstrap/dist/css/bootstrap.css';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap";
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

//Need this
import firebase from './utils/firebase'

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Movies from "./pages/Movies";
import Tvshows from "./pages/Tvshows";
import SearchMovie from './pages/SearchMovie';
import RecommendedMovies from './pages/RecommendedMovies';
import RecommendedShows from './pages/RecommendedShows';
import SearchTV from './pages/SearchTV';
import MovieNyte from './pages/MovieNyte';


export default function All() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />

        <Route path="tvshows" element={<Tvshows />} />
        <Route path="searchtv" element={<SearchTV />} />
        <Route path="recommendedshows" element={<RecommendedShows />} />

        <Route path="movies" element={<Movies />} />
        <Route path="searchmovie" element={<SearchMovie />} />
        <Route path="recommendedmovies" element={<RecommendedMovies />} />

        <Route path="movienyte" element={<MovieNyte />} />

      </Routes>

    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<All />);
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();