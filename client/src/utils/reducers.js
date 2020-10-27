import { useReducer } from 'react';

import {
    ADD_TO_REMOVED_MOVIES,
    ADD_TO_SAVED_MOVIES,
    UPDATE_SAVED_MOVIES
} from "./actions";

export const reducer = (state, action) => {
    switch (action.type) {
        case ADD_TO_REMOVED_MOVIES:
            return {
                ...state,
                savedMovies: state.savedMovies.filter(savedMovie => savedMovie.movieId !== action.movie.movieId),
                removedMovies: [...state.removedMovies, action.movie.movieId]
            }
        case ADD_TO_SAVED_MOVIES:
            return {
                ...state,
                savedMovies: [...state.savedMovies, action.movie],
                removedMovies: state.removedMovies.filter(removedMovieId => removedMovieId !== action.movie.movieId)
            }
        case UPDATE_SAVED_MOVIES:
            return {
                ...state,
                savedMovies: action.savedMovies
            }
        default:
            return state ? state : '';
    }
};

export function useMovieReducer(initialState) {
    return useReducer(reducer, initialState);
}