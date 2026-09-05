import React from 'react';
import Navbar from '../pages/Navbar';

const Layout = ({ children }) => {
    return (
        <div className="app-layout">
            <Navbar />
            <main>{children}</main>
        </div>
    );
};

export default Layout;