import { useState, useEffect } from 'react';

// Import all images from assets folder
import img1 from '../../assets/A_travel_station_in_Yaounde.jpg';
import img2 from '../../assets/ac0115c200b867df897b82be118608edd9b6ec3d.png';
import img3 from '../../assets/african-american-man.jpg';
import img4 from '../../assets/CamTransit.png';
import img5 from '../../assets/Carrefour_Ndokotti_à_Douala_Cameroun_03.jpg';
import img6 from '../../assets/good bus pic.jpg';
import img7 from '../../assets/istockphoto-1408969843-1024x1024.jpg';
import img8 from '../../assets/istockphoto-1687379432-1024x1024.jpg';
import img9 from '../../assets/Kutenda_Center,_lieu_de_repos_pour_voyageurs_03.jpg';
import img10 from '../../assets/Transport_terrestre_interurbain_par_bus_au_Cameroun_12.jpg';
import img11 from '../../assets/young-adult-travelling.jpg';

const images = [img1, img2, img3, img4, img5, img6, img7, img8, img9, img10, img11];

export function ImageSlider({ interval = 4000, className = '' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
        setIsTransitioning(false);
      }, 500); // Half of transition duration for smooth crossfade
    }, interval);

    return () => clearInterval(timer);
  }, [interval]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {images.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <img
            src={image}
            alt={`Slide ${index + 1}`}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
      
      {/* Optional: Slide indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setIsTransitioning(true);
              setTimeout(() => {
                setCurrentIndex(index);
                setIsTransitioning(false);
              }, 500);
            }}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-white w-6'
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default ImageSlider;
