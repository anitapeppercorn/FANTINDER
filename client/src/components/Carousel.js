import React from 'react';
import Carousel from 'react-bootstrap/Carousel';

function ControlledCarousel() {
    return (
<Carousel>
  <Carousel.Item>
    <img
      className="d-block w-100"
      src= 'https://image.tmdb.org/t/p/w185_and_h278_bestv2/rplLJ2hPcOQmkFhTqUte0MkEaO2.jpg'
      alt="First slide"
    />
    <Carousel.Caption>
      <h3>1</h3>
      <p>...</p>
    </Carousel.Caption>
  </Carousel.Item>

  <Carousel.Item>
    <img
      className="d-block w-100"
      src="https://image.tmdb.org/t/p/w185_and_h278_bestv2/rplLJ2hPcOQmkFhTqUte0MkEaO2.jpg"
      alt="Second slide"
    />
    <Carousel.Caption>
      <h3>2</h3>
      <p>...</p>
    </Carousel.Caption>
  </Carousel.Item>

  <Carousel.Item>
    <img
      className="d-block w-100"
      src="https://image.tmdb.org/t/p/w185_and_h278_bestv2/rplLJ2hPcOQmkFhTqUte0MkEaO2.jpg"
      alt="Third slide"
    />
    <Carousel.Caption>
      <h3>3</h3>
      <p>...</p>
    </Carousel.Caption>
  </Carousel.Item>

</Carousel>
    );
  }
  
  export default ControlledCarousel;