import './App.css';
import Footer from "./pages/Footer";

function App() {
    return (
        <div className="homepage-wrapper">

            {/* Hero Section */}
            <div className="image-container hero-container">
                <div className="hero-content">
                    <h1 className="hero-title animate-pop-in">ViewVault</h1>
                    <p className="hero-tagline animate-fade-in">Discover entertainment, curate your vault, and master your movie nights.</p>
                    <div className="hero-buttons animate-slide-up">
                        <a className="btn-premium btn-premium-primary" href="#about">
                            Get Started
                        </a>
                        <a className="btn-premium btn-premium-outline" href="#how">
                            MovieNyte™
                        </a>
                    </div>
                </div>
                {/* Decorative overlay */}
                <div className="hero-overlay"></div>
            </div>

            {/* About Section */}
            <section id="about" className="section-padding">
                <div className="modern-section">
                    <div className="row align-items-center">
                        <div className="col-lg-6 mb-4 mb-lg-0">
                            <h2 className="customh2 mb-4">Your Personal Entertainment Sanctuary</h2>
                            <p className="introtext mb-4">ViewVault is a versatile platform designed for organizing and curating vaults of movies and TV shows. It simplifies the process of managing and exploring entertainment options across various genres, ensuring a seamless viewing experience.</p>
                            <div className="d-flex gap-3">
                                <span className="badge bg-secondary p-2 px-3 rounded-pill">Movies</span>
                                <span className="badge bg-secondary p-2 px-3 rounded-pill">TV Shows</span>
                                <span className="badge bg-secondary p-2 px-3 rounded-pill">Vaults</span>
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="image-card-decorative shadow-lg rounded-4 overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop" className="img-fluid" alt="Cinema" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why ViewVault Section */}
            <section className="section-padding bg-light-section">
                <div className="modern-section">
                    <h2 className="customh2 text-center mb-5">Why ViewVault?</h2>
                    <div className="row g-4">
                        <div className="col-md-4">
                            <div className="feature-card">
                                <span className="feature-icon">🚀</span>
                                <h4 className="feature-title">Streamlined Experience</h4>
                                <p className="feature-text">Simplify complex processes with a user-friendly interface designed for effortless navigation and vault organization.</p>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="feature-card">
                                <span className="feature-icon">✨</span>
                                <h4 className="feature-title">Personalized Discovery</h4>
                                <p className="feature-text">Get tailored suggestions based on your unique preferences and viewing history for an enjoyable discovery experience.</p>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="feature-card">
                                <span className="feature-icon">🛡️</span>
                                <h4 className="feature-title">Complete Control</h4>
                                <p className="feature-text">Easily add, remove, and prioritize content. Your vault, your rules—managed seamlessly in one central place.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* MovieNyte Section */}
            <section className="section-padding" id="how">
                <div className="modern-section">
                    <div className="section-bg shadow-lg">
                        <div className="row align-items-center">
                            <div className="col-lg-7">
                                <span className="badge bg-white text-primary mb-3 p-2 px-3 rounded-pill fw-bold">FEATURED TOOL</span>
                                <h2 className="customh2 text-white mb-4">Meet MovieNyte™</h2>
                                <p className="introtext text-white opacity-90 mb-4">
                                    Revolutionize the way your group chooses films. No more endless scrolling or "I don't know, what do you want to watch?".
                                    MovieNyte analyzes everyone's preferences—genres, ratings, and even origins—to find the perfect match for the whole group.
                                </p>
                                <ul className="list-unstyled text-white mb-4">
                                    <li className="mb-2"><span className="me-2">✅</span> Group preferences synthesis</li>
                                    <li className="mb-2"><span className="me-2">✅</span> Smart age rating filters</li>
                                    <li className="mb-2"><span className="me-2">✅</span> One-click recommendations</li>
                                </ul>
                            </div>
                            <div className="col-lg-5 text-center text-lg-end">
                                <div className="p-4 bg-white bg-opacity-10 rounded-4 backdrop-blur border border-white border-opacity-20 animate-float">
                                    <h4 className="text-white mb-3">Host a MovieNyte</h4>
                                    <p className="text-white-50 small mb-4">Combine 2-10 profiles instantly</p>
                                    <a href="/movienyte" className="btn btn-light w-100 rounded-pill fw-bold py-2 shadow-sm">Try it now</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <Footer></Footer>
        </div>
    );
}

export default App;
