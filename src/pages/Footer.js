import React from "react";
import { FaGithub, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
    return (
        <footer className="footer text-center m-3">
            <hr />
            <p className="mb-0">Made by Aneesh Sharma</p>
            <div className="">
                <a href="https://github.com/AneeshSharma9" target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                    <FaGithub className="mx-1" />
                </a>
                <a href="https://www.linkedin.com/in/aneeshsharma9" target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                    <FaLinkedin className="mx-1" />
                </a>
            </div>
        </footer>
    )
}

export default Footer;