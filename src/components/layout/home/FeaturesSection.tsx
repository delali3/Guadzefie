import React, { useState } from 'react';
import { Truck, Users, BookOpen, ShieldCheck } from 'lucide-react';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  ctaText?: string;
  ctaUrl?: string;
}

interface FeaturesSectionProps {
  title?: string;
  subtitle?: string;
  features?: Feature[];
  className?: string;
}

const FeaturesSection: React.FC<FeaturesSectionProps> = ({
  title = "Why Farm With Us",
  subtitle = "We connect Ghanaian farmers to buyers with these benefits",
  className = "",
  features
}) => {
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  
  const defaultFeatures: Feature[] = [
    {
      id: "direct",
      title: "Direct Market Access",
      description: "Sell your produce directly to buyers without middlemen, increasing your profits and ensuring fair prices.",
      icon: <Truck size={24} />,
      ctaText: "How It Works",
      ctaUrl: "#selling-process"
    },
    {
      id: "training",
      title: "Free Farming Training",
      description: "Access training resources on modern farming techniques, soil management, and sustainable agriculture practices.",
      icon: <BookOpen size={24} />,
      ctaText: "Training Resources",
      ctaUrl: "#training"
    },
    {
      id: "community",
      title: "Farming Community",
      description: "Join our network of Ghanaian farmers to share knowledge, resources, and support each other's agricultural businesses.",
      icon: <Users size={24} />,
      ctaText: "Join Community",
      ctaUrl: "#community"
    },
    {
      id: "quality",
      title: "Quality Certification",
      description: "Get your produce certified for quality and organic standards, increasing its value and appeal to buyers.",
      icon: <ShieldCheck size={24} />,
      ctaText: "Certification Process",
      ctaUrl: "#certification"
    }
  ];

  const featuresToRender = features || defaultFeatures;

  return (
    <div className={`py-12 ${className}`}>
      {(title || subtitle) && (
        <div className="text-center mb-12">
          {title && <h2 className="text-3xl font-bold text-green-800 dark:text-green-300 mb-4">{title}</h2>}
          {subtitle && <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">{subtitle}</p>}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {featuresToRender.map((feature) => (
          <div
            key={feature.id}
            className="flex flex-col h-full p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-100 dark:border-gray-700 transition-all duration-300 hover:shadow-lg"
            onMouseEnter={() => setHoveredFeature(feature.id)}
            onMouseLeave={() => setHoveredFeature(null)}
            onFocus={() => setHoveredFeature(feature.id)}
            onBlur={() => setHoveredFeature(null)}
          >
            <div 
              className={`flex items-center justify-center h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-6 transition-all duration-300 ${
                hoveredFeature === feature.id ? 'scale-110' : ''
              }`}
            >
              {feature.icon}
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
            
            <p className="text-gray-700 dark:text-gray-300 mb-6 flex-grow">{feature.description}</p>
            
            {feature.ctaText && feature.ctaUrl && (
              <a 
                href={feature.ctaUrl}
                className="text-green-600 dark:text-green-400 font-medium text-sm mt-auto inline-flex items-center hover:text-green-700 dark:hover:text-green-300 focus:outline-none focus:underline"
                aria-label={`${feature.ctaText} about ${feature.title}`}
              >
                {feature.ctaText}
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturesSection;