import Navbar from "./Navbar";
import { useLocation } from 'react-router-dom';
import { useState, useEffect } from "react";


const Recommended = () => {
    const location = useLocation();

    return (
        <>
            <Navbar></Navbar>
            <div className="container">
                <h1 className="text-center">Movies like {location.state.name}</h1>
            </div>
        </>
    )
};

export default Recommended;