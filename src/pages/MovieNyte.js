import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import { auth, db } from "../utils/firebase"
import { useNavigate } from 'react-router-dom';
import Footer from "./Footer";

function MovieNyte() {
  return (
    <div className="">
            <Navbar />
            <div className="container-fluid">
                <div className="container">
                    <div className="p-4">
                        <h1 className="text-center m-4 fw-bold">MovieNyte</h1>
                    </div>
                </div>
            </div>
            <Footer></Footer>
        </div>
  )
}

export default MovieNyte