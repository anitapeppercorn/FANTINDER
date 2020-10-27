// import our actions
import {
    ADD_TO_REMOVED_MOVIES,
    ADD_TO_SAVED_MOVIES,
    UPDATE_SAVED_MOVIES
} from '../utils/actions';

// import reducer
import { reducer } from '../utils/reducers';

// create a sample of what our global state will look like
const initialState = {
    savedMovies: [
        {
            "movieId": 1,
            "vote": 9.0,
            "voteCount": 111,
            "overview": "This is Grumpy Cat's movie",
            "name": "Grumpy Cat",
            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Grumpy_Cat_%2814556024763%29_%28cropped%29.jpg/220px-Grumpy_Cat_%2814556024763%29_%28cropped%29.jpg",
            "release": "2020-10-10",
            "trailer": "https://www.youtube.com/watch?v=INscMGmhmX4"
        },
        {
            "movieId": 2,
            "vote": 7.0,
            "voteCount": 222,
            "overview": "This is Grumpy Cat's Second Movie",
            "name": "Grumpy Cat: The Sequel",
            "image": "https://ichef.bbci.co.uk/news/400/cpsprodpb/26AC/production/_107000990_grumpycat5.jpg",
            "release": "2020-10-24",
            "trailer": "https://www.youtube.com/watch?v=g-1g3SDswGA"
        }
    ],
    removedMovies: [3, 4]
};

test('ADD_TO_SAVED_MOVIES', () => {
    let newState = reducer(initialState, {
        type: ADD_TO_SAVED_MOVIES,
        movie: {
            "movieId": 3,  // new movieId
            "vote": 9.0,
            "voteCount": 111,
            "overview": "This is Grumpy Cat's movie",
            "name": "Grumpy Cat",
            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Grumpy_Cat_%2814556024763%29_%28cropped%29.jpg/220px-Grumpy_Cat_%2814556024763%29_%28cropped%29.jpg",
            "release": "2020-10-10",
            "trailer": "https://www.youtube.com/watch?v=INscMGmhmX4"
        }
    });

    // check saved movies
    expect(newState.savedMovies.length).toBe(3);
    expect(newState.savedMovies[2].movieId).toBe(3);
    expect(initialState.savedMovies.length).toBe(2);

    // check removed movies
    expect(newState.removedMovies.length).toBe(1);
    expect(newState.removedMovies[0]).toBe(4);
    expect(initialState.removedMovies.length).toBe(2);
});

test('ADD_TO_REMOVED_MOVIES', () => {
    let newState = reducer(initialState, {
        type: ADD_TO_REMOVED_MOVIES,
        movie: {
            "movieId": 1,
            "vote": 9.0,
            "voteCount": 111,
            "overview": "This is Grumpy Cat's movie",
            "name": "Grumpy Cat",
            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Grumpy_Cat_%2814556024763%29_%28cropped%29.jpg/220px-Grumpy_Cat_%2814556024763%29_%28cropped%29.jpg",
            "release": "2020-10-10",
            "trailer": "https://www.youtube.com/watch?v=INscMGmhmX4"
        }
    });

    // // check saved movies
    expect(newState.savedMovies.length).toBe(1);
    expect(newState.savedMovies[0].movieId).toBe(2);
    expect(initialState.savedMovies.length).toBe(2);

    // check removed movies
    expect(newState.removedMovies.length).toBe(3);
    expect(newState.removedMovies[2]).toBe(1);
    expect(initialState.removedMovies.length).toBe(2);
});

test('UPDATE_SAVED_MOVIES', () => {
    let newState = reducer(initialState, {
        type: UPDATE_SAVED_MOVIES,
        savedMovies: [{
            "movieId": 3,  // new movieId
            "vote": 9.0,
            "voteCount": 111,
            "overview": "This is Grumpy Cat's movie",
            "name": "Grumpy Cat",
            "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Grumpy_Cat_%2814556024763%29_%28cropped%29.jpg/220px-Grumpy_Cat_%2814556024763%29_%28cropped%29.jpg",
            "release": "2020-10-10",
            "trailer": "https://www.youtube.com/watch?v=INscMGmhmX4"
        }]
    });

    // check saved movies
    expect(newState.savedMovies.length).toBe(1);
    expect(newState.savedMovies[0].movieId).toBe(3);
    expect(initialState.savedMovies.length).toBe(2);
    expect(initialState.savedMovies.length).toBe(2);
});