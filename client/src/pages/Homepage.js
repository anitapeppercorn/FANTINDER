import React, { useEffect, useState } from 'react';

// import TMDB API dependencies
import { getTrendingMovies } from '../utils/API';

// import GraphQL Dependencies
import { SAVE_MOVIE, REMOVE_MOVIE } from '../utils/mutations';
import { GET_USER } from '../utils/queries';
import { useMutation, useQuery } from '@apollo/react-hooks';

// import GlobalState dependencies
import { useFantinderContext } from "../utils/GlobalState";
import { ADD_TO_REMOVED_MOVIES, ADD_TO_SAVED_MOVIES, UPDATE_REMOVED_MOVIES, UPDATE_SAVED_MOVIES } from '../utils/actions';

// import components
import { Container, Jumbotron } from 'react-bootstrap';
import SingleMovieCard from '../components/SingleMovieCard';

// import indexedDB dependencies
import { idbPromise } from "../utils/helpers";

const Homepage = () => {
    const [state, dispatch] = useFantinderContext();
    const [movies, setMovies] = useState([]);
    const [displayedMovie, setDisplayedMovie] = useState('');

    const [removeMovie, { removeError }] = useMutation(REMOVE_MOVIE);
    const [saveMovie, { saveError }] = useMutation(SAVE_MOVIE);
    const { loading, data } = useQuery(GET_USER);

    useEffect(() => {
        if (!movies[0]) {
            // start with trending movies
            getTrendingMovies('day', setMovies);
        } else {
            const filteredMovies = movies.filter(movie => {
               const isSaved = state.savedMovies?.some(savedMovie => savedMovie.movieId === movie.movieId);
               const isRemoved = state.removedMovies?.some(removedMovieId => removedMovieId === movie.movieId);

               return !isSaved && !isRemoved
            })
            setDisplayedMovie(filteredMovies[0]);
        }
    })
    // get the movies from The Movie Database endpoints
    useEffect(() => {
        if(data) {
            dispatch({
                type: UPDATE_REMOVED_MOVIES,
                removedMovies: data.me.removedMovies
            })

            dispatch({
                type: UPDATE_SAVED_MOVIES,
                savedMovies: data.me.savedMovies
            })

            data.me.removedMovies.forEach((movieId) => {
                idbPromise('removedMovies', 'put', { movieId });
            });
    
            data.me.savedMovies.forEach((movie) => {
                idbPromise('savedMovies', 'put', movie);
            });
        // add else if to check if `loading` is undefined in `useQuery()` Hook (meaning we're offline)
        } else if (!loading) {
            idbPromise('removedMovies', 'get').then((removedMovies) => {
                dispatch({
                    type: UPDATE_REMOVED_MOVIES,
                    removedMovies: removedMovies
                });
            });

            idbPromise('savedMovies', 'get').then((savedMovies) => {
                dispatch({
                    type: UPDATE_SAVED_MOVIES,
                    savedMovies: savedMovies
                });
            })
        }
    }, [data, loading, dispatch]);

    const handleSaveMovie = async (movie) => {
        try {
            // update the db
            const { data } = await saveMovie({
                variables: { input: movie }
            });

            if (saveError) {
                throw new Error('Something went wrong!');
            }

            // update global state
            dispatch({
                type: ADD_TO_SAVED_MOVIES,
                movie: movie
            });

            idbPromise('savedMovies', 'put', movie);
            idbPromise('removedMovies', 'delete', { movieId: movie.movieId });

            // update the movies to display
            if (movies.length > 1) {
                const updatedMovies = await movies.slice(1);
                console.log({ updatedMovies });
                setMovies(updatedMovies);
            } else {
                console.log('no more movies!');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleRemoveMovie = async (movie) => {
        console.log({ movieId:movie.movieId });
        try {
            // update the db
            const { data } = await removeMovie({
                variables: { movieId: movie.movieId }
            });

            if (removeError) {
                throw new Error('Something went wrong!');
            }

            // update global state
            dispatch({
                type: ADD_TO_REMOVED_MOVIES,
                movie: movie
            });

            idbPromise('savedMovies', 'delete', { ...movie });
            idbPromise('removedMovies', 'put', { movieId: movie.movieId });

            // update the movies to display
            if (movies.length > 1) {
                const updatedMovies = await movies.slice(1);
                console.log({ updatedMovies });
                setMovies(updatedMovies);
            } else {
                console.log('no more movies!');
            }
        } catch (err) {
            console.error(err);
        }
    };

    return(
        <>
            <Jumbotron fluid className="text-light">
                <Container>
                    <h1>Discover new movies!</h1>
                </Container>
            </Jumbotron>

            <Container>
                {displayedMovie && 
                    <SingleMovieCard
                        displayTrailer 
                        movie={displayedMovie}
                        saveMovieHandler={handleSaveMovie}
                        removeMovieHandler={handleRemoveMovie}
                        disabled={state.savedMovies?.some((savedMovie) => savedMovie.movieId === displayedMovie.movieId)}
                        btnColor={state.savedMovies?.some((savedMovie) => savedMovie.movieId === displayedMovie.movieId) ? "outline-secondary" : "outline-success" } />
                }
            </Container>
        </>
    );
}

export default Homepage;