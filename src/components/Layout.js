import React, { useState, useCallback, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import Navbar from '../pages/Navbar';

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [sidebarWidth, setSidebarWidth] = useState(280);
    const [isResizing, setIsResizing] = useState(false);
    const isOpeningRef = useRef(false);

    const toggleSidebar = () => {
        if (!sidebarOpen && sidebarWidth < 250) {
            setSidebarWidth(280);
        }
        setSidebarOpen(!sidebarOpen);
    };

    const handleOpenSidebar = (e) => {
        e.stopPropagation();
        e.preventDefault();
        // Set flag to prevent closing logic from triggering
        isOpeningRef.current = true;
        // Set width first, then open to prevent closing logic from triggering
        setSidebarWidth(280);
        setSidebarOpen(true);
        // Reset flag after a short delay
        setTimeout(() => {
            isOpeningRef.current = false;
        }, 350);
    };

    const startResizing = useCallback((mouseDownEvent) => {
        setIsResizing(true);
    }, []);

    const stopResizing = useCallback(() => {
        if (!isResizing) return; // Prevent multiple calls
        if (isOpeningRef.current) return; // Don't close if we're intentionally opening
        setIsResizing(false);
        // If sidebar is below threshold, smoothly close it
        // But only if we're actually resizing and not just opening
        if (sidebarWidth < 200 && sidebarOpen) {
            // Smoothly animate to 0 and close
            setSidebarWidth(0);
            setTimeout(() => {
                setSidebarOpen(false);
            }, 300);
        }
    }, [sidebarWidth, sidebarOpen, isResizing]);

    const resize = useCallback((mouseMoveEvent) => {
        if (isResizing) {
            let newWidth = mouseMoveEvent.clientX;
            if (newWidth < 200) {
                // Smoothly collapse by gradually reducing width
                // Keep sidebar "open" during drag to allow smooth width transition
                setSidebarOpen(true);
                const collapsedWidth = Math.max(0, newWidth);
                setSidebarWidth(collapsedWidth);
            } else {
                setSidebarOpen(true);
                if (newWidth > 450) newWidth = 450;
                setSidebarWidth(newWidth);
            }
        }
    }, [isResizing]);

    useEffect(() => {
        window.addEventListener("mousemove", resize);
        window.addEventListener("mouseup", stopResizing);
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [resize, stopResizing]);

    return (
        <div className={`app-layout ${!sidebarOpen ? 'sidebar-collapsed' : ''} ${isResizing ? 'is-resizing' : ''}`}>
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                width={sidebarWidth}
                onResizeStart={startResizing}
            />

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="sidebar-overlay d-lg-none"
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 1040
                    }}
                />
            )}

            <div className="main-content" style={{ marginLeft: sidebarOpen ? sidebarWidth : 0 }}>
                {!sidebarOpen && (
                    <div
                        className="sidebar-edge-handle d-none d-lg-flex align-items-center justify-content-center"
                        onMouseDown={startResizing}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '24px',
                            height: '100%',
                            cursor: 'col-resize',
                            zIndex: 1001,
                            transition: 'all 0.3s ease',
                            background: 'transparent',
                            borderRight: '1px solid transparent'
                        }}
                    >
                        <div className="edge-handle-bar" style={{
                            width: '4px',
                            height: '40px',
                            borderRadius: '4px',
                            background: 'rgba(107, 70, 193, 0.2)',
                            transition: 'all 0.3s ease'
                        }} />
                        <button
                            className="btn btn-sm btn-premium btn-premium-primary rounded-circle p-0"
                            onClick={handleOpenSidebar}
                            onMouseDown={(e) => e.stopPropagation()}
                            style={{
                                position: 'absolute',
                                left: '10px',
                                width: '32px',
                                height: '32px',
                                opacity: 0,
                                transform: 'translateX(-20px)',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                            }}
                        >
                            <span style={{ fontSize: '1.2rem' }}>❯</span>
                        </button>
                    </div>
                )}
                <Navbar onToggleSidebar={toggleSidebar} isSidebarOpen={sidebarOpen} />
                <main>{children}</main>
            </div>
        </div>
    );
};

export default Layout;
