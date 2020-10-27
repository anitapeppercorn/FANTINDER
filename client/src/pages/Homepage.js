import React, { useState } from 'react';

// import TMDB API dependencies
import { getMovies, getTrendingMovies } from '../utils/API';

// import react-bootstrap components
import { Container, Jumbotron } from 'react-bootstrap';
import MovieCards from '../components/MovieCards';

const Homepage = () => {
    // const [topRatedMovies, setTopRatedMovies] = useState([]);
    // const [popularMovies, setPopularMovies] = useState([]);
    // const [latestMovies, setLatestMovies] = useState([]);
    const [trendingMovies, setTrendingMovies] = useState([]);

    // get the movies from The Movie Database endpoints
    // getMovies('top_rated', setTopRatedMovies);
    // getMovies('popular', setPopularMovies);
    // getMovies('latest', setLatestMovies);
    getTrendingMovies('day', setTrendingMovies);
    
    return(
        <>
            <Jumbotron fluid className="text-light">
                <Container>
                    <h1>Discover new movies!</h1>
                </Container>
            </Jumbotron>

            <Container>
                <MovieCards displayTrailers='true' moviesToDisplay={trendingMovies} />
            </Container>
        </>
    );
}

export default Homepage;