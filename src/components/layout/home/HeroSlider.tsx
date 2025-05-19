import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../../components/ui/Button';

interface SlideProps {
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  image: string;
  link: string;
}

const HeroSlider: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  
  const slides: SlideProps[] = [
    {
      title: "Fresh Farm Produce",
      subtitle: "Direct from Ghanaian Farms",
      description: "Connect directly with local farmers and purchase fresh, high-quality produce at fair prices.",
      buttonText: "Explore Produce",
      image: "https://img.freepik.com/free-photo/photorealistic-view-african-people-harvesting-vegetables-grains_23-2151487536.jpg?t=st=1743871277~exp=1743874877~hmac=8adcc1d285ea9c4454392a09d4bf07dbc0e16afbde95e0aecc5df7e104b5d76a&w=1380",
      link: "/products?sort=newest"
    },
    {
      title: "Seasonal Harvests",
      subtitle: "Freshly Harvested Crops",
      description: "Discover the latest harvests from farms across Ghana's regions, delivered straight to your doorstep.",
      buttonText: "View Harvests",
      image: "https://img.freepik.com/free-photo/countryside-worker-planting-out-field_23-2148761816.jpg?t=st=1743871470~exp=1743875070~hmac=3fc056d41b6d182a6bff94643b74c580ce2fd23af9258d707417c6941b36f4a7&w=1380",
      link: "/products?category=fresh"
    },
    {
      title: "Organic Farming",
      subtitle: "Sustainably Grown Products",
      description: "Support eco-friendly farming practices with our selection of certified organic products from local farms.",
      buttonText: "Shop Organic",
      image: "https://img.freepik.com/free-photo/countryside-workers-out-field_23-2148761770.jpg?t=st=1743871405~exp=1743875005~hmac=4bd3cf3bda0722a1c7afe195ccfe2e1a23e9cf2982b21c37101009410b944523&w=1380",
      link: "/products?category=organic"
    }
  ];

  // Auto rotation with pause on hover
  useEffect(() => {
    const sliderElement = document.getElementById('hero-slider');
    let interval: NodeJS.Timeout;
    
    const startInterval = () => {
      interval = setInterval(() => {
        setActiveSlide((current) => (current + 1) % slides.length);
      }, 5000);
    };
    
    const stopInterval = () => {
      clearInterval(interval);
    };
    
    startInterval();
    
    if (sliderElement) {
      sliderElement.addEventListener('mouseenter', stopInterval);
      sliderElement.addEventListener('mouseleave', startInterval);
    }
    
    return () => {
      clearInterval(interval);
      if (sliderElement) {
        sliderElement.removeEventListener('mouseenter', stopInterval);
        sliderElement.removeEventListener('mouseleave', startInterval);
      }
    };
  }, [slides.length]);
  
  // Handle navigation
  const goToSlide = useCallback((index: number) => {
    setActiveSlide(index);
  }, []);
  
  const goToNextSlide = useCallback(() => {
    setActiveSlide((current) => (current + 1) % slides.length);
  }, [slides.length]);
  
  const goToPrevSlide = useCallback(() => {
    setActiveSlide((current) => (current === 0 ? slides.length - 1 : current - 1));
  }, [slides.length]);
  
  // Touch controls for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 100) {
      // Swipe left
      goToNextSlide();
    }
    
    if (touchStart - touchEnd < -100) {
      // Swipe right
      goToPrevSlide();
    }
  };
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevSlide();
      } else if (e.key === 'ArrowRight') {
        goToNextSlide();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [goToNextSlide, goToPrevSlide]);

  return (
    <div 
      id="hero-slider"
      className="relative overflow-hidden rounded-xl shadow-xl bg-gray-900 dark:bg-gray-800"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Navigation Arrows */}
      <button 
        onClick={goToPrevSlide}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-md transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Previous slide"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button 
        onClick={goToNextSlide}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-md transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Next slide"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Slides container */}
      <div className="relative h-[70vh] min-h-[550px] max-h-[800px]">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === activeSlide 
                ? 'opacity-100 translate-x-0 scale-100' 
                : 'opacity-0 translate-x-8 scale-105 pointer-events-none'
            }`}
          >
            {/* Background Image with subtle zoom effect */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-10000 ease-out"
              style={{
                backgroundImage: `url(${slide.image})`,
                transform: index === activeSlide ? 'scale(1.05)' : 'scale(1)',
                transformOrigin: 'center'
              }}
            />
            
            {/* Custom gradient overlay with texture */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-900/80 via-green-800/50 to-transparent" />
            
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iLjA1Ij48cGF0aCBkPSJNMjAgMGMxMS4wNDYgMCAyMCA4Ljk1NCAyMCAyMHY5SDIwdjExSDB2LTQuMjc3QzAgMjQuMDI5IDguMDU0IDAgMjAgMHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
            
            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-center md:justify-center items-start px-8 md:px-16 lg:px-24">
              <div className={`max-w-lg transition-all duration-1000 delay-200 transform ${
                index === activeSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}>
                <span className="inline-block px-4 py-1.5 mb-6 text-xs md:text-sm font-semibold tracking-wider text-white bg-green-600 rounded-full shadow-lg transform hover:scale-105 transition-transform">
                  {slide.subtitle}
                </span>
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 text-white leading-tight">
                  {slide.title}
                </h2>
                <p className="text-base md:text-xl mb-8 max-w-lg text-gray-200 leading-relaxed">
                  {slide.description}
                </p>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <Link to={slide.link}>
                    <Button 
                      size="lg" 
                      className="shadow-lg shadow-green-600/20 bg-green-600 hover:bg-green-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl"
                    >
                      {slide.buttonText}
                    </Button>
                  </Link>
                  <Link to="/categories">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border-white/20 transition-all duration-300 transform hover:-translate-y-1"
                    >
                      Browse Farm Categories
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Progress Bar Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex items-center space-x-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`relative h-2 rounded-full transition-all duration-500 focus:outline-none ${
              index === activeSlide ? 'w-16 bg-white' : 'w-8 bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          >
            {index === activeSlide && (
              <span className="absolute inset-0 bg-white rounded-full animate-progress"></span>
            )}
          </button>
        ))}
      </div>
      
      {/* Slide Count */}
      <div className="absolute bottom-8 right-8 text-white text-sm font-medium bg-black/20 backdrop-blur-md rounded-full px-4 py-2">
        <span className="text-white">{activeSlide + 1}</span>
        <span className="text-white/60"> / {slides.length}</span>
      </div>
    </div>
  );
};

// Add this to your global CSS or tailwind config
// @keyframes progress {
//   from { width: 0; }
//   to { width: 100%; }
// }
// .animate-progress {
//   animation: progress 5s linear;
// }

export default HeroSlider;