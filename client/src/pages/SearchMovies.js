import React, { useEffect, useState } from 'react';
// Components
import { Form, Button, CardColumns, Container, Jumbotron } from 'react-bootstrap';
import MovieCard from '../components/MovieCard'
import { cleanMovieData } from '../utils/movieData';
// TMDB API
import { searchTMDB } from '../utils/API';
// GraphQL
import { ADD_MOVIE, DISLIKE_MOVIE, LIKE_MOVIE } from '../utils/mutations';
import { GET_USER } from '../utils/queries';
import { useMutation, useQuery } from '@apollo/react-hooks';
// Context API
import { useFantinderContext } from "../utils/GlobalState";
import {
    ADD_TO_DISLIKED_MOVIES,
    ADD_TO_LIKED_MOVIES,
    UPDATE_MOVIE_PREFERENCES
} from '../utils/actions';
// indexedDB
import { idbPromise } from "../utils/helpers";

const SearchMovies = () => {
    // State
    const [state, dispatch] = useFantinderContext();
    const [searchInput, setSearchInput] = useState('');
    const [noResultsFound, setNoResultsFound] = useState(false);
    const [searchedMovies, setSearchedMovies] = useState([]);
    const [searching, setSearching] = useState(false);
    // GraphQL
    const [addMovie, { addMovieError }] = useMutation(ADD_MOVIE);
    const [dislikeMovie] = useMutation(DISLIKE_MOVIE);
    const [likeMovie] = useMutation(LIKE_MOVIE);
    const { loading, data } = useQuery(GET_USER);

    // get the movie preferences for the current user to handle like/dislike functionality
    useEffect(() => {
        // retrieved from server
        if (data && !(state.dislikedMovies.length || state.likedMovies.length)) {
            dispatch({
                type: UPDATE_MOVIE_PREFERENCES,
                likedMovies: data.me.likedMovies,
                dislikedMovies: data.me.dislikedMovies
            })

            data.me.dislikedMovies.forEach((movie) => {
                idbPromise('dislikedMovies', 'put', movie);
                idbPromise('likedMovies', 'delete', movie);
            });
    
            data.me.likedMovies.forEach((movie) => {
                idbPromise('dislikedMovies', 'delete', movie);
                idbPromise('likedMovies', 'put', movie);
            });
        }
        // get cache from idb
        else if (!loading) {
            idbPromise('dislikedMovies', 'get').then(dislikedMovies => {
                idbPromise('likedMovies', 'get').then(likedMovies => {
                    dispatch({
                        type: UPDATE_MOVIE_PREFERENCES,
                        likedMovies: likedMovies,
                        dislikedMovies: dislikedMovies
                    })
                })
            })
        }
    }, [data, loading, dispatch, state.dislikedMovies.length, state.likedMovies.length]);

    const handleFormSubmit = async (event) => {
        event.preventDefault();

        setSearchedMovies([]);
        setSearching(true);

        if (!searchInput) {
            return false;
        }

        const response = await searchTMDB(searchInput);

        if (!response.ok) {
            throw new Error("Couldn't search for movies");
        }

        const { results } = await response.json();

        // return early if no results found
        if (results.length === 0) {
            setNoResultsFound(true);
            setSearching(false);
            return;
        }

        const cleanedMovies = await cleanMovieData(results);

        const updatedSearchedMovies = [];
        for (let i=0; i < cleanedMovies.length; i++) {

            // add the movie to the DB
            const { data } = await addMovie({
                variables: { input: cleanedMovies[i] }
            })

            // update searchedMovies state
            if (!addMovieError) {
                updatedSearchedMovies.push(data.addMovie);
            }
        };

        setSearchedMovies(updatedSearchedMovies);
        setSearching(false);
        setNoResultsFound(false);
    };

    const handleLikeMovie = (likedMovie) => {
        // update the db
        likeMovie({
            variables: { movieId: likedMovie._id }
        })
        .then(data => {
            if (data) {
                // update global state
                dispatch({
                    type: ADD_TO_LIKED_MOVIES,
                    movie: likedMovie
                });
    
                // update idb
                idbPromise('likedMovies', 'put', likedMovie);
                idbPromise('dislikedMovies', 'delete', likedMovie);

            } else {
                console.error("Couldn't like the movie!");
            }
        })
        .catch(err => console.error(err));
    };

    const handleDislikeMovie = (dislikedMovie) => {
        // update the db
        dislikeMovie({
            variables: { movieId: dislikedMovie._id }
        })
        .then(data => {
            if (data) {
                // update global state
                dispatch({
                    type: ADD_TO_DISLIKED_MOVIES,
                    movie: dislikedMovie
                });
    
                // update idb
                idbPromise('likedMovies', 'delete', dislikedMovie);
                idbPromise('dislikedMovies', 'put', dislikedMovie);

            } else {
                console.error("Couldn't dislike the movie!");
            }
        })
        .catch(err => console.error(err));
    };

    return (
        <>
            <Jumbotron fluid className="text-light bg-dark">
                <Container>
                    <Form onSubmit={(event) => handleFormSubmit(event, searchInput)}>
                        <Form.Label className="h3">Find your favorite movies</Form.Label>
                        <Form.Control
                            name='searchInput'
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            type='text'
                            placeholder='The Lord of the Rings'
                        />
                        <Button type='submit' className="mt-2">Search</Button>
                    </Form>
                </Container>
            </Jumbotron>
            <Container>
                {!searching && noResultsFound
                    ?   <h2 className="results-heading">No movies found! Please try another search.</h2>
                    :   <>
                            <h2 className="results-heading">
                                {searchedMovies.length > 0 && `Viewing ${searchedMovies.length} results:`}
                            </h2>
                            <CardColumns>
                                {searchedMovies?.map(movie => {
                                    return (
                                        <MovieCard
                                            key={movie._id}
                                            movie={movie}
                                            displayTrailer
                                            likeMovieHandler={handleLikeMovie}
                                            dislikeMovieHandler={handleDislikeMovie}
                                        />
                                    )
                                })}
                            </CardColumns>
                        </>
                }
            </Container>
        </>
    );
};

export default SearchMovies;