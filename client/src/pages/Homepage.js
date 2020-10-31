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
    const [moviesToDisplay, setMoviesToDisplay] = useState([]);
    // GraphQL
    const [addMovie, { addMovieError }] = useMutation(ADD_MOVIE);
    const [dislikeMovie] = useMutation(DISLIKE_MOVIE);
    const [likeMovie] = useMutation(LIKE_MOVIE);
    const { loading, data } = useQuery(GET_USER);

    useEffect(() => {
        // get data from TMDB API if we're online
        if (movies.length > 0 ) {
            console.log('using the movies in global store')
            // set moviesToDisplay to an array of movies that haven't been liked or disliked
            setMoviesToDisplay(
                movies.filter(movie => {
                    const isLiked = likedMovies.some(likedMovie => likedMovie._id === movie._id);
                    const isDisliked = dislikedMovies.some(dislikedMovie => dislikedMovie._id === movie._id);
                    return !isLiked && !isDisliked;
                })
            )
        }
        // if data, means we're online
        else if (data) {
            if (Auth.loggedIn()) {
                console.log('updating movie preferences')
                // update movie preferences
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

            console.log('pinging TMDB API to get trending movies')
            // get the movies to display
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

                            // update state.movies
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
        // get cache from idb
        else if (!loading) {
            idbPromise('movies', 'get').then(movies => {
                dispatch({
                    type: UPDATE_MOVIES,
                    movies
                })
                idbPromise('dislikedMovies', 'get').then(dislikedMovies => {
                    idbPromise('likedMovies', 'get').then(likedMovies => {
                        dispatch({
                            type: UPDATE_MOVIE_PREFERENCES,
                            likedMovies,
                            dislikedMovies
                        })
                    })
                })
            })
        }
    }, [movies, data, loading, likedMovies, dislikedMovies, addMovie, addMovieError, dispatch])

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

    const handleSkipMovie = async () => {
        // put the current movie at the end of the array if it's not the only movie
        if (movies.length > 1) {
            const currentMovie = await moviesToDisplay[0];
            const updatedMovies = await moviesToDisplay.slice(1,);
            updatedMovies.push(currentMovie);
            setMoviesToDisplay(updatedMovies)
        }
        // if this is the only movie left, set moviesToDisplay to an empty array.
        else {
            setMoviesToDisplay([]);
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
                {moviesToDisplay.length
                ?   <MovieCard
                        movie={moviesToDisplay[0]}
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