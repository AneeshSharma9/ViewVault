import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import axios from "axios";

const MovieNyte = () => {
    const initialPersonState = { id: 1, name: "Person 1", preferences: { genre: [], rating: [], year: '', runtime: '', language: '', country: '' } };
    const [people, setPeople] = useState([initialPersonState]);
    const [genres, setGenres] = useState([]);
    const [currentPerson, setCurrentPerson] = useState(null);
    const [customName, setCustomName] = useState("");
    const [tempPreferences, setTempPreferences] = useState({
        genre: [],
        rating: [],
        year: '',
        runtime: '',
        language: '',
        country: ''
    });

    useEffect(() => {
        // Fetch genres from TMDB API
        const getOptions = async () => {
            try {
                const genre_response = await axios.get(`https://api.themoviedb.org/3/genre/movie/list?language=en`, {
                    params: {
                        api_key: process.env.REACT_APP_API_KEY,
                    }
                });
                const genres = genre_response.data.genres;
                setGenres(genres);
            } catch (error) {
                console.error('Error fetching genres:', error);
            }
        };
        getOptions();
    }, []);

    const addPerson = () => {
        const newPerson = {
            id: people.length + 1,
            name: `Person ${people.length + 1}`,
            preferences: { ...initialPersonState.preferences }
        };
        setPeople([...people, newPerson]);
    };

    const deletePerson = (index) => {
        const newPeople = people.filter((_, i) => i !== index);
        setPeople(newPeople);
    };

    const handlePreferenceChange = (event) => {
        const { name, value, checked } = event.target;
        const updatedTempPreferences = { ...tempPreferences };

        if (name === 'rating' || name === 'genre') {
            updatedTempPreferences[name] = checked
                ? [...tempPreferences[name], value]
                : tempPreferences[name].filter(item => item !== value);
        } else {
            updatedTempPreferences[name] = value;
        }
        setTempPreferences(updatedTempPreferences);
    };

    const handleCloseModal = () => {
        setCurrentPerson(null);
        setCustomName("");
        setTempPreferences({
            genre: [],
            rating: [],
            year: '',
            runtime: '',
            language: '',
            country: ''
        });
    };

    const handleSavePreferences = () => {
        if (currentPerson !== null) {
            const updatedPeople = [...people];
            updatedPeople[currentPerson] = {
                ...updatedPeople[currentPerson],
                name: customName, // Update name here
                preferences: { ...tempPreferences }
            };
            setPeople(updatedPeople);
        }
        handleCloseModal();
    };

    const handleNameChange = (event) => {
        setCustomName(event.target.value);
    };

    useEffect(() => {
        if (currentPerson !== null) {
            setCustomName(people[currentPerson].name); // Set initial value for custom name input
            setTempPreferences({ ...people[currentPerson].preferences }); // Set initial value for preferences
        }
    }, [currentPerson]);

    return (
        <div>
            <Navbar />
            <div className="container-fluid">
                <div className="container">
                    <div className="p-4">
                        <h1 className="text-center m-4 fw-bold">MovieNyte</h1>
                        {people?.map((person, index) => (
                            <div key={index} className="mb-4">
                                <div className="card shadow">
                                    <div className="card-body">
                                        <button
                                            type="button" className="btn btn-outline-danger"
                                            onClick={() => deletePerson(index)}
                                            style={{ position: 'absolute', right: '10px', top: '10px' }}>
                                            <span aria-hidden="true">&times;</span>
                                        </button>
                                        <h3 className="card-title">{person.name}</h3>
                                        <h6>Preferences</h6>
                                        <ul className="list-group list-group-flush">
                                            <li className="list-group-item">Genres: {person.preferences.genre.join(', ')}</li>
                                            <li className="list-group-item">Age Rating: {person.preferences.rating.join(', ')}</li>
                                            <li className="list-group-item">Release Year: {person.preferences.year}</li>
                                            <li className="list-group-item">Runtime: {person.preferences.runtime}</li>
                                            <li className="list-group-item">Language: {person.preferences.language}</li>
                                            <li className="list-group-item">Country of Origin: {person.preferences.country}</li>
                                        </ul>
                                        <button type="button" className="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#staticBackdrop" onClick={() => setCurrentPerson(index)}>Edit</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button className="btn btn-primary" onClick={addPerson}>+</button>
                    </div>
                </div>
            </div>

            <div className="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h1 className="modal-title fs-5" id="staticBackdropLabel">{`Edit Preferences for ${customName}`}</h1>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={handleCloseModal}></button>
                        </div>
                        <div className="modal-body">
                            <form>
                                <div className="form-group">
                                    <label>Person's Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Enter person's name"
                                        value={customName}
                                        onChange={handleNameChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Genres</label>
                                    <div className="checkbox-list">
                                        {genres?.map(genre => (
                                            <div key={genre.id} className="form-check">
                                                <input className="form-check-input" type="checkbox" name="genre" value={genre.name.toString()} checked={tempPreferences.genre.includes(genre.name.toString())} onChange={handlePreferenceChange} />
                                                <label className="form-check-label"> {genre.name} </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Age Rating</label>
                                    <div className="checkbox-list">
                                        <div className="form-check">
                                            <input className="form-check-input" type="checkbox" name="rating" value="G" checked={tempPreferences.rating.includes("G")} onChange={handlePreferenceChange}/>
                                            <label className="form-check-label">G</label>
                                        </div>
                                        <div className="form-check">
                                            <input className="form-check-input" type="checkbox" name="rating" value="PG" checked={tempPreferences.rating.includes("PG")} onChange={handlePreferenceChange}/>
                                            <label className="form-check-label">PG</label>
                                        </div>
                                        <div className="form-check">
                                            <input className="form-check-input" type="checkbox" name="rating" value="PG-13" checked={tempPreferences.rating.includes("PG-13")} onChange={handlePreferenceChange}/>
                                            <label className="form-check-label">PG-13</label>
                                        </div>
                                        <div className="form-check">
                                            <input className="form-check-input" type="checkbox" name="rating" value="R" checked={tempPreferences.rating.includes("R")} onChange={handlePreferenceChange}/>
                                            <label className="form-check-label">R</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Release Year</label>
                                    <input type="number" className="form-control" name="year" value={tempPreferences.year} onChange={handlePreferenceChange} />
                                </div>
                                <div className="form-group">
                                    <label>Runtime</label>
                                    <input type="number" className="form-control" name="runtime" value={tempPreferences.runtime} onChange={handlePreferenceChange} />
                                </div>
                                <div className="form-group">
                                    <label>Language</label>
                                    <input type="text" className="form-control" name="language" value={tempPreferences.language} onChange={handlePreferenceChange} />
                                </div>
                                <div className="form-group">
                                    <label>Country of Origin</label>
                                    <input type="text" className="form-control" name="country" value={tempPreferences.country} onChange={handlePreferenceChange} />
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal" onClick={handleCloseModal}>Close</button>
                            <button type="button" className="btn btn-primary" data-bs-dismiss="modal" onClick={handleSavePreferences}>Save changes</button>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default MovieNyte;
