import React, { useEffect } from 'react';
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
    const { likedMovies } = state;
    // GraphQL
    const [dislikeMovie] = useMutation(DISLIKE_MOVIE);
    const [likeMovie] = useMutation(LIKE_MOVIE);
    const { loading, data } = useQuery(GET_USER);

    useEffect(() => {
        // if we're online, use sever to update movie preferences
        if (data && data.me && !likedMovies.length) {
            console.log("Online, using data from server to update movie preferences")
            dispatch({
                type: UPDATE_MOVIE_PREFERENCES,
                likedMovies: data.me.likedMovies,
                dislikedMovies: data.me.dislikedMovies
            });
        }
        // if we're offline, use idb to update movie preferences
        else if (!loading && !likedMovies.length) {
            console.log("Offline, using data from idb to update movie preferences")
            idbPromise('likedMovies', 'get').then(likedMovies => {
                idbPromise('dislikedMovies', 'get').then(dislikedMovies => {
                    dispatch({
                        type: UPDATE_MOVIE_PREFERENCES,
                        likedMovies,
                        dislikedMovies
                    })
                })
            })
        }
    })
    
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
                    {likedMovies?.length > 0 
                    ? `Displaying ${likedMovies.length} saved ${likedMovies.length === 1 ? "movie" : "movies"}:`
                    : "You have no saved movies!"   
                    }
                    
                </h2>
                <CardColumns>
                    {likedMovies?.length
                    ? likedMovies.map(movie => {
                        return (
                            <MovieCard
                                key={movie._id}
                                movie={movie}
                                displayTrailer
                                likeMovieHandler={handleLikeMovie}
                                dislikeMovieHandler={handleDislikeMovie}
                            />
                        )})
                    : null}
                </CardColumns>
            </Container>
        </>
    );
};

export default SavedMovies;