import React, { useEffect, useState } from 'react';

// import TMDB API dependencies
import { getMovies, getTrendingMovies } from '../utils/API';

// import GraphQL Dependencies
import { SAVE_MOVIE, REMOVE_MOVIE } from '../utils/mutations';
import { GET_USER } from '../utils/queries';
import { useMutation, useQuery } from '@apollo/react-hooks';

// import GlobalState dependencies
import { useFantinderContext } from "../utils/GlobalState";
import { UPDATE_SAVED_MOVIES } from '../utils/actions';

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
               return !state.savedMovies?.some(savedMovie => savedMovie.movieId === movie.movieId);
            })
            setDisplayedMovie(filteredMovies[0]);
        }
    })
    // get the movies from The Movie Database endpoints
    useEffect(() => {
        if(data) {
            dispatch({
                type: UPDATE_SAVED_MOVIES,
                savedMovies: data.me.savedMovies
            })
    
            data.me.savedMovies.forEach((movie) => {
                idbPromise('savedMovies', 'put', movie);
            });
        // add else if to check if `loading` is undefined in `useQuery()` Hook
        } else if (!loading) {
            // since we're offline, get all of the data from the `savedMovies` store
            idbPromise('savedMovies', 'get').then((savedMovies) => {
                // use retrieved data to set global state for offline browsing
                dispatch({
                    type: UPDATE_SAVED_MOVIES,
                    savedMovies: savedMovies
                });
            });
        }
    }, [data, loading, dispatch]);

    const handleSaveMovie = async (movie) => {
        try {
            // update the db
            const { data } = await saveMovie({
                variables: { input: movie }
            });

            // get savedMovies from the updated User
            const { saveMovie: saveMovieData } = data;
            const { savedMovies: updatedSavedMovies } = saveMovieData;

            if (saveError) {
                throw new Error('Something went wrong!');
            }

            // update global state
            dispatch({
                type: UPDATE_SAVED_MOVIES,
                savedMovies: updatedSavedMovies
            });

            idbPromise('savedMovies', 'put', { ...movie });

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
        try {
            // update the db
            const { data } = await removeMovie({
                variables: { movieId: movie.movieId }
            });

            // get savedMovies from the updated User
            const { removeMovie: saveMovieData } = data;
            const { savedMovies: updatedSavedMovies } = saveMovieData;

            if (removeError) {
                throw new Error('Something went wrong!');
            }

            // update global state
            dispatch({
                type: UPDATE_SAVED_MOVIES,
                savedMovies: updatedSavedMovies
            });

            idbPromise('savedMovies', 'delete', { ...movie });

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