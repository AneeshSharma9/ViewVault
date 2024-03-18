import 'bootstrap/dist/css/bootstrap.css';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap";
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import firebase from './utils/firebase'

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Movies from "./pages/Movies";
import Manga from "./pages/Manga";
import Anime from "./pages/Anime";
import Tvshows from "./pages/Tvshows";
import SearchMovie from './pages/SearchMovie';

export default function All() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="movies" element={<Movies />} />
        <Route path="manga" element={<Manga />} />
        <Route path="anime" element={<Anime />} />
        <Route path="tvshows" element={<Tvshows />} />
        <Route path="searchmovie" element={<SearchMovie />} />
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
