// import our actions
import {
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
    ]
};

test('UPDATE_SAVED_MOVIES', () => {
    let newState = reducer(initialState, {
        type: UPDATE_SAVED_MOVIES,
        savedMovies: [
            {
                "movieId": 3,  // new movieId
                "vote": 9.0,
                "voteCount": 111,
                "overview": "This is Grumpy Cat's movie",
                "name": "Grumpy Cat",
                "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Grumpy_Cat_%2814556024763%29_%28cropped%29.jpg/220px-Grumpy_Cat_%2814556024763%29_%28cropped%29.jpg",
                "release": "2020-10-10",
                "trailer": "https://www.youtube.com/watch?v=INscMGmhmX4"
            },
            {
                "movieId": 4,  // new movieId
                "vote": 7.0,
                "voteCount": 222,
                "overview": "This is Grumpy Cat's Second Movie",
                "name": "Grumpy Cat: The Sequel",
                "image": "https://ichef.bbci.co.uk/news/400/cpsprodpb/26AC/production/_107000990_grumpycat5.jpg",
                "release": "2020-10-24",
                "trailer": "https://www.youtube.com/watch?v=g-1g3SDswGA"
            }
        ]
    });

    expect(newState.savedMovies[0].movieId).toBe(3);
    expect(newState.savedMovies[1].movieId).toBe(4);

    expect(newState.savedMovies.length).toBe(2);
    expect(initialState.savedMovies.length).toBe(2);
});
