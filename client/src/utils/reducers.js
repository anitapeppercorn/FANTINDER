import { useReducer } from 'react';

import {
    UPDATE_REMOVED_MOVIES,
    UPDATE_SAVED_MOVIES
} from "./actions";

export const reducer = (state, action) => {
    switch (action.type) {
        case UPDATE_REMOVED_MOVIES:
            return {
                ...state,
                savedMovies: state.savedMovies?.filter(movie => movie.movieId !== action.movie.movieId),
                removedMovies: [...state.removedMovies, action.movie.movieId]
            }
        case UPDATE_SAVED_MOVIES:
            return {
                ...state,
                savedMovies: [...state.savedMovies, action.movie],
                removedMovies: state.removedMovies?.filter(movieId => movieId !== action.movie.movieId)
            }
        default:
            return state ? state : '';
    }
};

export function useMovieReducer(initialState) {
    return useReducer(reducer, initialState);
}