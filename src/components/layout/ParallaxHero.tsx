import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface ParallaxHeroProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  primaryButtonText?: string;
  primaryButtonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  height?: 'full' | 'large' | 'medium' | 'small';
  overlay?: 'light' | 'dark' | 'gradient' | 'none';
  particles?: boolean;
  children?: React.ReactNode;
}

export default function ParallaxHero({
  title,
  subtitle,
  backgroundImage = '/images/hero-bg.jpg',
  primaryButtonText,
  primaryButtonLink,
  secondaryButtonText,
  secondaryButtonLink,
  height = 'large',
  overlay = 'gradient',
  particles = true,
  children
}: ParallaxHeroProps) {
  
  const heightClass = {
    full: 'h-screen min-h-[700px]',
    large: 'h-[80vh] min-h-[600px]',
    medium: 'h-[60vh] min-h-[500px]',
    small: 'h-[40vh] min-h-[400px]'
  }[height];
  
  const overlayClass = {
    light: 'bg-white/40',
    dark: 'bg-primary-dark/70',
    gradient: 'bg-gradient-to-r from-primary/80 to-primary-dark/60',
    none: ''
  }[overlay];
  
  return (
    <section className={`relative ${heightClass} w-full flex items-center justify-center overflow-hidden parallax-container hero-section`}>
      {/* Background Image with Parallax Effect */}
      <div className="absolute inset-0 z-0">
        <div className="parallax-bg" data-speed="0.15">
          <Image
            src={backgroundImage}
            alt={title}
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
      
      {/* Overlay */}
      {overlay !== 'none' && (
        <div className={`absolute inset-0 z-1 ${overlayClass}`}></div>
      )}
      
      {/* Particle effect overlay */}
      {particles && (
        <div className="hero-particles">
          {Array.from({ length: 12 }).map((_, index) => {
            const particles = [
              { width: '15px', height: '15px', left: '10%', top: '20%', duration: '8s', delay: '0s', opacity: 0.15 },
              { width: '25px', height: '25px', left: '80%', top: '15%', duration: '12s', delay: '1s', opacity: 0.2 },
              { width: '20px', height: '20px', left: '15%', top: '70%', duration: '10s', delay: '2s', opacity: 0.18 },
              { width: '30px', height: '30px', left: '70%', top: '60%', duration: '9s', delay: '3s', opacity: 0.12 },
              { width: '18px', height: '18px', left: '45%', top: '25%', duration: '11s', delay: '4s', opacity: 0.16 },
              { width: '22px', height: '22px', left: '85%', top: '75%', duration: '13s', delay: '0.5s', opacity: 0.22 },
              { width: '16px', height: '16px', left: '5%', top: '50%', duration: '14s', delay: '1.5s', opacity: 0.14 },
              { width: '28px', height: '28px', left: '60%', top: '35%', duration: '7s', delay: '2.5s', opacity: 0.19 },
              { width: '24px', height: '24px', left: '35%', top: '80%', duration: '15s', delay: '3.5s', opacity: 0.17 },
              { width: '26px', height: '26px', left: '90%', top: '40%', duration: '6s', delay: '4.5s', opacity: 0.21 },
              { width: '19px', height: '19px', left: '25%', top: '10%', duration: '11s', delay: '1.8s', opacity: 0.13 },
              { width: '32px', height: '32px', left: '55%', top: '85%', duration: '8.5s', delay: '3.2s', opacity: 0.25 }
            ];
            
            return (
              <div 
                key={index}
                className="hero-particle floating-animation"
                style={{
                  width: particles[index].width,
                  height: particles[index].height,
                  left: particles[index].left,
                  top: particles[index].top,
                  animationDuration: particles[index].duration,
                  animationDelay: particles[index].delay,
                  opacity: particles[index].opacity
                }}
              ></div>
            );
          })}
        </div>
      )}
      
      {/* Gold accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary-dark via-secondary to-secondary-light z-10"></div>
      
      {/* Content */}
      <div className="relative z-10 text-white text-center px-4 max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight animate-fade-in">
          {title.split(' ').map((word, i) => (
            <span key={i}>
              {i === Math.floor(title.split(' ').length / 2) ? (
                <span className="gradient-text" data-text={word}>{word} </span>
              ) : (
                `${word} `
              )}
            </span>
          ))}
        </h1>
        
        {subtitle && (
          <p className="text-lg md:text-xl mb-10 text-white/90 max-w-3xl mx-auto animate-slide-up delay-200">
            {subtitle}
          </p>
        )}
        
        {children}
        
        {/* Buttons */}
        {(primaryButtonText || secondaryButtonText) && (
          <div className="flex flex-col md:flex-row gap-4 justify-center animate-slide-up delay-400">
            {primaryButtonText && primaryButtonLink && (
              <Link
                href={primaryButtonLink}
                className="btn-primary flex items-center justify-center group"
              >
                {primaryButtonText}
                <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
            
            {secondaryButtonText && secondaryButtonLink && (
              <Link
                href={secondaryButtonLink}
                className="glass-effect px-6 py-3 rounded-full border border-white/30 text-white transition-all flex items-center justify-center group hover:bg-white/20"
              >
                {secondaryButtonText}
                <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
} 