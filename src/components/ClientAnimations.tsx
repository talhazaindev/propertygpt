"use client";

import { useEffect } from 'react';

export default function ClientAnimations() {
  useEffect(() => {
    // Scroll reveal animation
    function handleScrollAnimation() {
      const reveals = document.querySelectorAll('[data-animate="true"], .reveal');
      
      for (let i = 0; i < reveals.length; i++) {
        const windowHeight = window.innerHeight;
        const elementTop = reveals[i].getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < windowHeight - elementVisible) {
          reveals[i].classList.add('active');
        } else {
          reveals[i].classList.remove('active');
        }
      }

      // Parallax effect for backgrounds
      const parallaxElements = document.querySelectorAll('.parallax-bg');
      for (let i = 0; i < parallaxElements.length; i++) {
        const scrollY = window.scrollY;
        const element = parallaxElements[i] as HTMLElement;
        const speedAttr = element.getAttribute('data-speed');
        const speed = speedAttr ? parseFloat(speedAttr) : 0.2;
        
        const yPos = -(scrollY * speed);
        element.style.transform = `translateY(${yPos}px)`;
      }
    }
    
    // Initial check
    handleScrollAnimation();
    
    // Add event listeners
    window.addEventListener('scroll', handleScrollAnimation);
    window.addEventListener('load', handleScrollAnimation);
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScrollAnimation);
      window.removeEventListener('load', handleScrollAnimation);
    };
  }, []);

  return null;
} 