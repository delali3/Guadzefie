import React, { useState } from 'react';

interface TestimonialProps {
  content: string;
  author: string;
  role: string;
  rating: number;
  image?: string;
  cropGrown?: string;
}

const Testimonials: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  const testimonials: TestimonialProps[] = [
    {
      content: "This platform has transformed how I sell my cassava. I now reach customers directly and earn 30% more than before. The training resources also helped me implement better farming practices.",
      author: "Kwame Mensah",
      role: "Cassava Farmer, Eastern Region",
      rating: 5,
      cropGrown: "Cassava"
    },
    {
      content: "As a restaurant owner, I can now source fresh ingredients directly from local farms. The quality is exceptional, and I love supporting Ghanaian farmers while knowing exactly where my produce comes from.",
      author: "Ama Darko",
      role: "Restaurant Owner, Accra",
      rating: 5,
      cropGrown: "Buyer"
    },
    {
      content: "The training resources provided through this platform have helped me improve my cocoa yields by nearly 30%. I've been able to implement sustainable farming practices while increasing my income.",
      author: "Joseph Owusu",
      role: "Cocoa Farmer, Western Region",
      rating: 4,
      cropGrown: "Cocoa"
    },
    {
      content: "I've been able to access better markets for my vegetables through this platform. The weather alerts have also been invaluable for planning my planting and harvesting schedules.",
      author: "Fatima Ibrahim",
      role: "Vegetable Farmer, Northern Region",
      rating: 5,
      cropGrown: "Vegetables"
    }
  ];
  
  const handleNext = () => {
    setActiveIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };
  
  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };
  
  return (
    <div className="relative overflow-hidden">
      {/* Background with pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-yellow-600 opacity-90"></div>
      <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJ3aGl0ZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTh2MmgtMnYtMmgyem0tNCAwdi0yaC00djJoNHptLTQgOGg0di00aC00djR6bTggMHYtNGgtMnY0aDJ6TTI0IDI0djJoMnYtMmgtMnptLTQgNGgydi0yaC0ydjJ6bTQgMHYtMmgtMnYyaDJ6bTggMGgtMnYyaDJ2LTJ6bS00IDRoLTR2Mmg0di0yek00OCA0MGgtNHY0aDR2LTR6bTAgOGg0di00aC00djR6bS00LTEyaC00djRoNHYtNHptOC00aC00djRoNHYtNHptMCA4di00aC00djRoNHptLTggMGgtNHY0aDR2LTR6bS00IDhoNHYtNGgtNHY0em00IDBo-NC12NGg0djR6Ii8+PC9nPjwvc3ZnPg==')]"></div>
      
      {/* Main container */}
      <div className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 rounded-xl overflow-hidden">
        {/* Quote icon */}
        <svg 
          className="absolute top-12 left-0 transform -translate-x-1/2 text-white/10 h-24 w-24" 
          fill="currentColor" 
          viewBox="0 0 32 32" 
          aria-hidden="true"
        >
          <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
        </svg>
        
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              What Our Farmers & Buyers Say
            </h2>
            <p className="text-green-100 text-lg max-w-3xl mx-auto">
              Hear from the farmers and customers who are part of our growing agricultural community
            </p>
          </div>
          
          <div className="relative mt-10 md:mt-16">
            {/* Testimonial cards in slider format */}
            <div className="flex overflow-hidden">
              {testimonials.map((testimonial, index) => (
                <div 
                  key={index}
                  className={`flex-none w-full transition-transform duration-500 ease-in-out transform ${
                    index === activeIndex 
                      ? 'translate-x-0 opacity-100' 
                      : index < activeIndex 
                        ? '-translate-x-full opacity-0 absolute' 
                        : 'translate-x-full opacity-0 absolute'
                  }`}
                  style={{ left: index === activeIndex ? '0' : 'auto' }}
                >
                  <div className="max-w-3xl mx-auto">
                    <div className="relative p-8 md:p-10 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
                      {/* Quote icon */}
                      <div className="absolute -top-4 -left-4 h-12 w-12 rounded-full bg-green-600 flex items-center justify-center">
                        <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                        </svg>
                      </div>
                      
                      {/* Rating stars */}
                      <div className="flex items-center mb-4">
                        {[...Array(5)].map((_, i) => (
                          <svg 
                            key={i} 
                            className={`h-5 w-5 ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                          {testimonial.rating}.0 / 5.0
                        </span>
                      </div>
                      
                      {/* Testimonial content */}
                      <p className="text-xl md:text-2xl font-medium text-gray-800 dark:text-white leading-relaxed mb-8">
                        "{testimonial.content}"
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <img 
                            src={testimonial.image || `https://ui-avatars.com/api/?name=${testimonial.author.replace(' ', '+')}&background=random&color=fff&size=128`} 
                            alt={testimonial.author} 
                            className="h-12 w-12 rounded-full border-2 border-green-100 mr-4 object-cover"
                          />
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white text-lg">{testimonial.author}</h4>
                            <div className="flex items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</span>
                              
                              {testimonial.cropGrown && testimonial.cropGrown !== "Buyer" && (
                                <>
                                  <span className="mx-2 text-gray-400">•</span>
                                  <span className="text-sm text-green-600 dark:text-green-400">
                                    Grows {testimonial.cropGrown}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="hidden md:block">
                          <svg className="h-8 w-8 text-green-600 dark:text-green-400 opacity-50" fill="currentColor" viewBox="0 0 448 512">
                            <path d="M0 216C0 149.7 53.7 96 120 96h8c17.7 0 32 14.3 32 32s-14.3 32-32 32h-8c-30.9 0-56 25.1-56 56v8h64c35.3 0 64 28.7 64 64v64c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V320 288 216zm256 0c0-66.3 53.7-120 120-120h8c17.7 0 32 14.3 32 32s-14.3 32-32 32h-8c-30.9 0-56 25.1-56 56v8h64c35.3 0 64 28.7 64 64v64c0 35.3-28.7 64-64 64H320c-35.3 0-64-28.7-64-64V320 288 216z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Navigation controls */}
            <div className="flex items-center justify-center mt-8 space-x-6">
              <button 
                onClick={handlePrev}
                className="p-2 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Previous testimonial"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {/* Dots */}
              <div className="flex space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white/50 ${
                      index === activeIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/60'
                    }`}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>
              
              <button 
                onClick={handleNext}
                className="p-2 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Next testimonial"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Testimonials;