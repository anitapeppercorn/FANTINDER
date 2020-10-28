const { gql } = require('apollo-server-express');

const typeDefs = gql`
    type Auth {
        token: ID!
        user: User
    }

    type Movie {
        _id: ID
        tmdbId: Int
        rating: Float
        voteCount: Int
        title: String
        overview: String
        releaseDate: String
        poster: String
        trailer: String
    }

    type User {
        _id: ID
        username: String
        email: String
        friendCount: Int
        friends: [User]
        likedMovies: [ID]
        dislikedMovies: [ID]
    }

    type Query {
        me: User
        movies: [Movie]
        movie(movieId: ID!): Movie
        users: [User]
        user(username: String!): User
    }

    input MovieInput {
        tmdbId: Int
        rating: Float
        voteCount: Int
        title: String
        overview: String
        releaseDate: String
        poster: String
        trailer: String
    }

    type Mutation {
        login(email: String!, password: String!): Auth
        addUser(username: String!, email: String!, password: String!): Auth
        addFriend(friendId: ID!): User
        addMovie(input: MovieInput): Movie 
        likeMovie(movieId: ID!): User
        dislikeMovie(movieId: ID!): User
    }
`;

module.exports = typeDefs; 