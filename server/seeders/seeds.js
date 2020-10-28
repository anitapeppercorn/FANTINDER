//generate dummy data
const faker = require('faker');
const db = require('../config/connection');
const { Movie, User } = require('../models');

db.once('open', async () => {
  await Movie.remove({});
  await User.remove({});

  // create user data
  const userData = [];
  for (let i = 0; i < 50; i += 1) {
    const username = faker.internet.userName();
    const email = faker.internet.email(username);
    const password = faker.internet.password();
    userData.push({ username, email, password });
  }
  const createdUsers = await User.collection.insert(userData);

  // create friends
  for (let i = 0; i < 100; i += 1) {
    const randomUserIndex = Math.floor(Math.random() * createdUsers.ops.length);
    const { _id: userId } = createdUsers.ops[randomUserIndex];
    let friendId = userId;
    while (friendId === userId) {
      const randomUserIndex = Math.floor(Math.random() * createdUsers.ops.length);
      friendId = createdUsers.ops[randomUserIndex];
    }
    await User.updateOne({ _id: userId }, { $addToSet: { friends: friendId } });
  }

  // create likedMovies
  let likedMovies = [];
  for (let i = 0; i < 100; i += 1) {
    const externalMovieId = faker.random.number();
    const rating = faker.finance.amount();
    //(min?: 1, max?: 10)
    const voteCount = faker.random.number();
    const title = faker.commerce.productName();
    const overview = faker.lorem.words(Math.round(Math.random() * 20) + 1);
    const releaseDate = faker.date.past();
    const poster = faker.image.imageUrl();
    const trailer = faker.image.imageUrl();
    //example//'https://image.tmdb.org/t/p/w185_and_h278_bestv2/rplLJ2hPcOQmkFhTqUte0MkEaO2.jpg'
//externalMovieId, rating, voteCount, title, overview, releaseDate, poster, trailer

    const randomUserIndex = Math.floor(Math.random() * createdUsers.ops.length);
    const { username, _id: userId } = createdUsers.ops[randomUserIndex];

    const likedMovie = await Movie.create({ externalMovieId, rating, voteCount, title, overview, releaseDate, poster, trailer, username });

    const updatedUser = await User.updateOne(
      { _id: userId },
      { $push: { movies: likedMovie._id } }
    );

    likedMovies.push(likedMovie);
  }

   // create dislikedMovies
   let dislikedMovies = [];
   for (let i = 0; i < 100; i += 1) {
     const externalMovieId = faker.random.number();
     const rating = faker.finance.amount();
     //(min?: 1, max?: 10)
     const voteCount = faker.random.number();
     const title = faker.commerce.productName();
     const overview = faker.lorem.words(Math.round(Math.random() * 20) + 1);
     const releaseDate = faker.date.past();
     const poster = faker.image.imageUrl();
     const trailer = faker.image.imageUrl();
     //example//'https://image.tmdb.org/t/p/w185_and_h278_bestv2/rplLJ2hPcOQmkFhTqUte0MkEaO2.jpg'
 //externalMovieId, rating, voteCount, title, overview, releaseDate, poster, trailer
 
     const randomUserIndex = Math.floor(Math.random() * createdUsers.ops.length);
     const { username, _id: userId } = createdUsers.ops[randomUserIndex];
 
     const dislikedMovie = await Movie.create({ externalMovieId, rating, voteCount, title, overview, releaseDate, poster, trailer, username });
 
     const updatedUser = await User.updateOne(
       { _id: userId },
       { $push: { movies: dislikedMovie._id } }
     );
 
     dislikedMovies.push(dislikedMovie);
   }

  console.log('all done!');
  process.exit(0);
});