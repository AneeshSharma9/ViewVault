import 'bootstrap/dist/css/bootstrap.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Movies from "./pages/Movies";
import Manga from "./pages/Manga";
import Anime from "./pages/Anime";
import Tvshows from "./pages/Tvshows";
import Search from './pages/Search';

export default function All() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="movies" element={<Movies />} />
        <Route path="manga" element={<Manga />} />
        <Route path="anime" element={<Anime />} />
        <Route path="tvshows" element={<Tvshows />} />
        <Route path="search" element={<Search />} />
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
