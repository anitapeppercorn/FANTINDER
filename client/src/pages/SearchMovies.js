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
import { UPDATE_DISLIKED_MOVIES, UPDATE_LIKED_MOVIES } from '../utils/actions';
// indexedDB
import { idbPromise } from "../utils/helpers";

const SearchMovies = () => {
    // state management
    const [state, dispatch] = useFantinderContext();
    const [searchInput, setSearchInput] = useState('');
    const [noResultsFound, setNoResultsFound] = useState(false);
    const [searchedMovies, setSearchedMovies] = useState([]);
    const [searching, setSearching] = useState(false);
    // graph ql
    const [addMovie, { addMovieError }] = useMutation(ADD_MOVIE);
    const [dislikeMovie, { dislikeError }] = useMutation(DISLIKE_MOVIE);
    const [likeMovie, { likeError }] = useMutation(LIKE_MOVIE);
    const { loading, data } = useQuery(GET_USER);

    // get the movie preferences for the current user to handle like/dislike functionality
    useEffect(() => {
        if (data && data.me) {
            dispatch({
                type: UPDATE_DISLIKED_MOVIES,
                dislikedMovies: data.me.dislikedMovies
            })

            dispatch({
                type: UPDATE_LIKED_MOVIES,
                likedMovies: data.me.likedMovies
            })

            data.me.dislikedMovies.forEach((movie) => {
                idbPromise('dislikedMovies', 'put', movie);
                idbPromise('likedMovies', 'delete', movie);
            });
    
            data.me.likedMovies.forEach((movie) => {
                idbPromise('dislikedMovies', 'delete', movie);
                idbPromise('likedMovies', 'put', movie);
            });
        } else if (!loading) {
            idbPromise('dislikedMovies', 'get').then(dislikedMovies => {
              dispatch({
                type: UPDATE_DISLIKED_MOVIES,
                dislikedMovies: dislikedMovies
              });
            });

            idbPromise('likedMovies', 'get').then(likedMovies => {
              dispatch({
                type: UPDATE_LIKED_MOVIES,
                likedMovies: likedMovies
              });
            });
          }
    }, [data, loading, dispatch]);

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

    const handleLikeMovie = async (likedMovie) => {
        try {
            // update the db
            let { data } = await likeMovie({
                variables: { movieId: likedMovie._id }
            });

            // throw an error if the mutation failed
            if (likeError) {
                throw new Error('Something went wrong!');
            }

            // update global state
            dispatch({
                type: UPDATE_LIKED_MOVIES,
                likedMovies: data.likeMovie.likedMovies
            });
            dispatch({
                type: UPDATE_DISLIKED_MOVIES,
                dislikedMovies: data.likeMovie.dislikedMovies
            });

            // update idb
            idbPromise('likedMovies', 'put', likedMovie);
            idbPromise('dislikedMovies', 'delete', likedMovie);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDislikeMovie = async (dislikedMovie) => {
        try {
            // update the db
            let { data } = await dislikeMovie({
                variables: { movieId: dislikedMovie._id }
            });

            // throw an error if the mutation failed
            if (dislikeError) {
                throw new Error('Something went wrong!');
            }

            // update global state
            dispatch({
                type: UPDATE_LIKED_MOVIES,
                likedMovies: data.dislikeMovie.likedMovies
            });
            dispatch({
                type: UPDATE_DISLIKED_MOVIES,
                dislikedMovies: data.dislikeMovie.dislikedMovies
            });

            // update idb
            idbPromise('likedMovies', 'put', dislikedMovie);
            idbPromise('dislikedMovies', 'delete', dislikedMovie);
        } catch (err) {
            console.error(err);
        }
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