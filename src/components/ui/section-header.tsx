import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  className?: string;
  light?: boolean;
}

export function SectionHeader({ 
  title, 
  subtitle, 
  centered = true, 
  className = '', 
  light = false 
}: SectionHeaderProps) {
  return (
    <div className={`mb-12 ${centered ? 'text-center' : ''} ${className}`}>
      <h2 
        className={`section-title text-3xl md:text-4xl font-bold mb-4 ${
          light ? 'text-white' : 'text-primary'
        }`}
      >
        {title.split(' ').map((word, i) => (
          i === title.split(' ').length - 1 ? (
            <span key={i} className="gradient-text" data-text={word}>{word}</span>
          ) : (
            <span key={i}>{word} </span>
          )
        ))}
      </h2>
      
      <div className={`w-20 h-1 ${centered ? 'mx-auto' : ''} mb-6 bg-gradient-to-r from-secondary to-secondary-light`}></div>
      
      {subtitle && (
        <p className={`max-w-3xl ${centered ? 'mx-auto' : ''} text-lg ${
          light ? 'text-white/80' : 'text-gray-600'
        }`}>
          {subtitle}
        </p>
      )}
    </div>
  );
} 