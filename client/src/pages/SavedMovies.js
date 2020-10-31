import React, { useEffect, useState } from 'react';
// Components
import { Jumbotron, CardColumns, Container } from 'react-bootstrap';
import MovieCard from '../components/MovieCard';
// GraphQL
import { DISLIKE_MOVIE, LIKE_MOVIE } from '../utils/mutations';
import { GET_USER } from '../utils/queries';
import { useMutation, useQuery } from '@apollo/react-hooks';
// Global State
import { useFantinderContext } from "../utils/GlobalState";
import { 
    ADD_TO_DISLIKED_MOVIES,
    ADD_TO_LIKED_MOVIES,
    UPDATE_MOVIE_PREFERENCES
} from '../utils/actions';
// IDB
import { idbPromise } from "../utils/helpers";

const SavedMovies = () => {
    // State
    const [state, dispatch] = useFantinderContext();
    const { likedMovies, movies } = state;
    const [moviesToDisplay, setMoviesToDisplay] = useState([]);
    // GraphQL
    const [dislikeMovie] = useMutation(DISLIKE_MOVIE);
    const [likeMovie] = useMutation(LIKE_MOVIE);
    const { loading, data } = useQuery(GET_USER);

    useEffect(() => {
        // movies are already in global store
        if (likedMovies.length) {
            setMoviesToDisplay(likedMovies);
        } 
        // retrieved from server
        else if (data) {
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
    }, [state, data, dispatch, movies.length, likedMovies, loading])

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
                    <h1>My Movies</h1>
                </Container>
            </Jumbotron>
            <Container>
                <h2 className="pb-5">
                    {loading
                        ?   null
                        :   moviesToDisplay?.length > 0 
                                ? `Displaying ${moviesToDisplay.length} saved ${moviesToDisplay.length === 1 ? "movie" : "movies"}.`
                                : "You have no saved movies!"   
                    }
                    
                </h2>
                <CardColumns>
                    {moviesToDisplay?.map(movie => {
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
            </Container>
        </>
    );
};

export default SavedMovies;