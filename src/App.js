import './App.css';
import './Homepage.css';
import Footer from "./pages/Footer";

const tickerItems = [
    "Popcorn ready",
    "Lights down",
    "Blockbuster night",
    "Fresh recommendations",
    "Curate your vault",
    "Group movie night",
];

function App() {
    const tickerLoop = [...tickerItems, ...tickerItems];

    return (
        <div className="homepage">

            {/* Marquee ticker */}
            <div className="vv-ticker" aria-hidden="true">
                <div className="vv-ticker-track">
                    {tickerLoop.map((item, i) => (
                        <span className="vv-ticker-item" key={i}>{item}</span>
                    ))}
                </div>
            </div>

            {/* Hero — marquee sign */}
            <section className="vv-hero">
                <span className="vv-marquee-sign">Now showing</span>
                <h1 className="vv-hero-title">
                    View<span className="accent">Vault</span>
                </h1>
                <p className="vv-hero-sub">
                    Discover entertainment, curate your vault, and master your movie nights —
                    all in one seriously fun place.
                </p>
                <div className="vv-hero-actions">
                    <a href="#about" className="vv-btn vv-btn-primary">Get Started</a>
                    <a href="#how" className="vv-btn vv-btn-ghost">MovieNyte&trade;</a>
                </div>
            </section>

            {/* Film strip divider */}
            <div className="vv-filmstrip" aria-hidden="true"></div>

            {/* About Section */}
            <section id="about" className="vv-section">
                <div className="vv-container">
                    <div className="vv-about-grid">
                        <div>
                            <p className="vv-label">About ViewVault</p>
                            <h2 className="vv-title">Your personal<br />movie sanctuary</h2>
                            <p className="vv-copy">
                                ViewVault is a versatile platform for organizing and curating vaults of
                                movies and TV shows. It simplifies managing and exploring entertainment
                                across genres, ensuring a seamless viewing experience.
                            </p>
                            <div className="vv-tags">
                                <span className="vv-tag">Movies</span>
                                <span className="vv-tag">TV Shows</span>
                                <span className="vv-tag">Vaults</span>
                            </div>
                        </div>
                        <div className="vv-image-frame">
                            <img
                                src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop"
                                alt="Cinema"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Film strip divider */}
            <div className="vv-filmstrip" aria-hidden="true"></div>

            {/* Why ViewVault Section */}
            <section className="vv-section">
                <div className="vv-container">
                    <div className="vv-features-grid">
                        <div className="vv-feature">
                            <p className="vv-feature-index">01</p>
                            <div className="vv-feature-stripes"></div>
                            <h4 className="vv-feature-title">Streamlined</h4>
                            <p className="vv-feature-copy">
                                A user-friendly interface for effortless navigation and vault organization.
                            </p>
                        </div>
                        <div className="vv-feature">
                            <p className="vv-feature-index">02</p>
                            <div className="vv-feature-stripes"></div>
                            <h4 className="vv-feature-title">Personalized</h4>
                            <p className="vv-feature-copy">
                                Tailored suggestions based on your unique preferences and viewing history.
                            </p>
                        </div>
                        <div className="vv-feature">
                            <p className="vv-feature-index">03</p>
                            <div className="vv-feature-stripes"></div>
                            <h4 className="vv-feature-title">Your rules</h4>
                            <p className="vv-feature-copy">
                                Easily add, remove, and prioritize content. Your vault, your rules.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Film strip divider */}
            <div className="vv-filmstrip" aria-hidden="true"></div>

            {/* MovieNyte Section */}
            <section className="vv-section" id="how">
                <div className="vv-container">
                    <div className="vv-cta-card">
                        <div>
                            <p className="vv-cta-label">Featured tool</p>
                            <h2 className="vv-cta-title">MovieNyte&trade;</h2>
                            <p className="vv-cta-copy">
                                Revolutionize the way your group chooses films. No more endless scrolling
                                or "I don't know, what do you want to watch?". MovieNyte analyzes
                                everyone's preferences to find the perfect match.
                            </p>
                            <ul className="vv-cta-list">
                                <li>Group preferences synthesis</li>
                                <li>Smart age rating filters</li>
                                <li>One-click recommendations</li>
                            </ul>
                            <a href="/movienyte" className="vv-cta-btn">Try it now</a>
                        </div>
                        <div className="vv-cta-reel">
                            <div className="vv-reel" title="Rolling the reels"></div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer></Footer>
        </div>
    );
}

export default App;
