import './App.css';
import Navbar from './pages/Navbar';
import Footer from "./pages/Footer";

function App() {
    return (
        <div className="mb-4 pb-4">
            <Navbar></Navbar>
            <div class="image-container">
                <img src="https://static-prod.adweek.com/wp-content/uploads/2022/03/movie-theater-buys-back-2022.jpg" class="w-100" alt="" />
                <span class="title">ViewVault</span>
                <span class="tagline">Discover entertainment</span>
                <div class="main-button homepage-button1">
                    <a class="colorchange nav-link" href="#about">
                        About
                    </a>
                </div>
                <div class="other-button homepage-button2">
                    <a class="colorchange-black nav-link" href="#how">
                        What is MovieNyte?
                    </a>
                </div>
            </div>
            <div id="about"></div>
            <div class="section-bg" >
                <h2 class="customh2 text-center homepage-offset " >About ViewVault</h2>
                <p class="introtext pb-5">ViewVault is a versatile platform designed for organizing and curating watchlists of movies, TV shows, anime, and manga. It simplifies the process of managing and exploring entertainment options across various genres, ensuring a seamless viewing experience.</p>
            </div>

            <h2 class="customh2 text-center">Why ViewVault?</h2>
            <div class="homepage-card-container">
                <div class="card homepage-card p-5">
                    <h5 className="card-title text-center mb-4">Inclusive Entertainment</h5>
                    <p>ViewVault stands out by integrating manga and anime alongside movies and TV shows, catering to diverse entertainment preferences in one consolidated platform.</p>
                </div>
                <div class="card homepage-card p-5">
                    <h5 className="card-title text-center mb-4">Streamlined Experience</h5>
                    <p>Unlike other websites, ViewVault simplifies complex processes, offering a user-friendly interface that enhances navigation and organization of watchlists effortlessly.</p>
                </div>
                <div class="card homepage-card p-5">
                    <h5 className="card-title text-center mb-4">Personalized Recommendations</h5>
                    <p>It provides tailored suggestions based on user preferences and viewing history, ensuring a more customized and enjoyable entertainment discovery.</p>
                </div>
                <div class="card homepage-card p-5">
                    <h5 className="card-title text-center mb-4">Comprehensive Management</h5>
                    <p>ViewVault enables comprehensive management of watchlists, allowing users to easily add, remove, and prioritize content for seamless viewing experiences..</p>
                </div>
            </div>

            <div class="homepage-offset" id="how"></div>
            <div class="section-bg pb-4">
                <h2 class="customh2 text-center pt-5" >
                    What is MovieNyte?
                </h2>
                <p class="introtext">
                    MovieNyte is an innovative feature crafted to revolutionize the way groups choose movies for their movie nights. Designed to alleviate the challenge of selecting a film that satisfies everyone's preferences, MovieNyte enables users to input detailed criteria for each participant, such as preferred genres, age ratings, and even specific countries of origin. By leveraging this information, MovieNyte generates personalized recommendations that consider all factors, ensuring that every movie night is not only seamless but also tailored to the collective tastes of the group. This intuitive tool streamlines the decision-making process, making it easier than ever to curate an evening of entertainment that everyone can enjoy together.
                </p>
            </div>
            <Footer></Footer>
        </div>
    );
}

export default App;
