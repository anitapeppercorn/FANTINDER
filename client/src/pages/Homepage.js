import React, { useEffect, useState } from 'react';
// Components
import { Container, Jumbotron } from 'react-bootstrap';
import MovieCard from '../components/MovieCard';
// TMDB API
import { getTrendingMovies } from '../utils/API';
// GraphQL
import { ADD_MOVIE, DISLIKE_MOVIE, LIKE_MOVIE } from '../utils/mutations';
import { GET_USER } from '../utils/queries';
import { useMutation, useQuery } from '@apollo/react-hooks';
// Global State
import { useFantinderContext } from "../utils/GlobalState";
import {
    ADD_TO_MOVIES,
    ADD_TO_DISLIKED_MOVIES,
    ADD_TO_LIKED_MOVIES,
    UPDATE_MOVIE_PREFERENCES,
    UPDATE_MOVIES
} from '../utils/actions';
// IndexedDB
import { idbPromise } from "../utils/helpers";
import { cleanMovieData } from '../utils/movieData';
// Other Utils
import Auth from '../utils/auth';

const Homepage = () => {
    const [state, dispatch] = useFantinderContext();
    const { movies, likedMovies, dislikedMovies } = state
    const [movieIndex, setMovieIndex] = useState('');
    // GraphQL
    const [addMovie, { addMovieError }] = useMutation(ADD_MOVIE);
    const [dislikeMovie] = useMutation(DISLIKE_MOVIE);
    const [likeMovie] = useMutation(LIKE_MOVIE);
    const { loading, data } = useQuery(GET_USER);

    // hook for updating movie preferences
    useEffect(() => {
        // if we're online, use server to update movie preferences
        if (!likedMovies.length && !dislikedMovies.length) {
            if (data && data.me) {
                if (data.me.likedMovies.length || !data.me.dislikedMovies.length) {
                    console.log("Online, using data from server to update movie preferences")
                    dispatch({
                        type: UPDATE_MOVIE_PREFERENCES,
                        likedMovies: data.me.likedMovies,
                        dislikedMovies: data.me.dislikedMovies
                    });
                }
            }
            // if we're offline, use idb to update movie preferences
            else if (!loading) {
                idbPromise('likedMovies', 'get').then(likedMovies => {
                    idbPromise('dislikedMovies', 'get').then(dislikedMovies => {
                        if (dislikedMovies.length || likedMovies.length) {
                            console.log("Offline, using data from idb to update movie preferences")
                            dispatch({
                                type: UPDATE_MOVIE_PREFERENCES,
                                likedMovies,
                                dislikedMovies
                            })
                        }
                    })
                })
            }
        }
    }, [data, loading, likedMovies, dislikedMovies, dispatch])

    // hook for displaying a movie
    useEffect(() => {
        if (movies.length && movieIndex === '') {// show the next movie
            console.log('There are movies, but no movieIndex. Setting movieIndex')
            for (let i=0; i < movies.length; i++) {
                const isLiked = likedMovies.some(likedMovie => likedMovie._id === movies[i]._id);
                const isDisliked = dislikedMovies.some(dislikedMovie => dislikedMovie._id === movies[i]._id);

                if (!isLiked && !isDisliked) {
                    setMovieIndex(i);
                    break;
                }
            }
        }
    }, [setMovieIndex, dislikedMovies, likedMovies, movies, movieIndex]);

    // hook for getting the movies
    useEffect(() => {
        if (!movies.length) {
            // if we're online, ping the API to get our movie preferences
            if (data) {
                console.log("Online, Pinging TMDB API to get trending movies");
                getTrendingMovies('week').then(res => {
                    if (res.ok) {
                        res.json().then(async ({ results }) => {
                            // clean the data to match our MovieSchema
                            const cleanedMovieData = await cleanMovieData(results);
                            cleanedMovieData.forEach(async movie => {
                                // add the movie to the db
                                const result = await addMovie({ variables: { input: movie } })

                                if (addMovieError) {
                                    throw new Error("Couldn't add movie");
                                }

                                const { data: newMovieData } = await result;
                                const { addMovie : newMovie } = await newMovieData;

                                // add the movie to the global store
                                dispatch({
                                    type: ADD_TO_MOVIES,
                                    movie: newMovie
                                })

                                // add to idb
                                idbPromise('movies', 'put', newMovie);
                            })
                        })
                    }
                    else {
                        throw new Error ("Couldn't load trending movies");
                    }
                })
            }
            // if we're offline, use idb to update movie preferences
            else if (!loading) {
                console.log("Offline")
                idbPromise('movies', 'get').then(movies => {
                    if (movies.length) {
                        console.log('Using IDB to get trending movies');
                        dispatch({
                            type: UPDATE_MOVIES,
                            movies
                        })
                    }
                })
            }
        }
    }, [movies, data, dispatch, loading, addMovie, addMovieError])

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

                // skip to the next movie
                handleSkipMovie();
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

                // skip to the next movie
                handleSkipMovie();
            } else {
                console.error("Couldn't dislike the movie!");
            }
        })
        .catch(err => console.error(err));
    };


    const handleSkipMovie = async () => {
        // put the current movie at the end of the array if it's not the only movie
        if (movies.length) {
            for (let i=movieIndex + 1; i < movies.length; i++) {
                const isLiked = likedMovies.some(likedMovie => likedMovie._id === movies[i]._id);
                const isDisliked = dislikedMovies.some(dislikedMovie => dislikedMovie._id === movies[i]._id);

                if (!isLiked && !isDisliked) {
                    setMovieIndex(i);
                    break;
                }
            }
        }
        // if this is the only movie left, set moviesToDisplay to an empty array.
        else {
            setMovieIndex('')
        }
    }
    
    return(
        <>
            <Jumbotron fluid className="text-light bg-dark">
                <Container>
                    <h1>Welcome to FANTINDER!</h1>
                    {Auth.loggedIn()
                        ? <h4>Click thumbs up to like and save a movie, thumbs down to pass.</h4>
                        : <h4>Check out our recommended movies below.</h4>
                    }
                </Container>
            </Jumbotron>

            <Container>
                {loading ? <h2>Loading....</h2> : null}
                {movies.length
                ?   <MovieCard
                        movie={movies[movieIndex]}
                        displayTrailer
                        displaySkip
                        likeMovieHandler={handleLikeMovie}
                        dislikeMovieHandler={handleDislikeMovie}
                        skipMovieHandler={handleSkipMovie}
                    />
                :  null
                }
            </Container>
        </>
    );
}

export default Homepage;