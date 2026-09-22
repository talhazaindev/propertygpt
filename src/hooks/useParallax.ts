import { useEffect, useState, RefObject } from 'react';

interface ParallaxOptions {
  speed?: number;
  reverse?: boolean;
  direction?: 'vertical' | 'horizontal';
  easing?: number;
}

/**
 * A hook for creating parallax scrolling effects
 * 
 * @param ref - Reference to the element to apply parallax effect to
 * @param options - Configuration options for the parallax effect
 * @returns An object with the current transform value
 */
export default function useParallax(
  ref: RefObject<HTMLElement>, 
  options: ParallaxOptions = {}
) {
  const { 
    speed = 0.1, 
    reverse = false, 
    direction = 'vertical',
    easing = 0.1
  } = options;
  
  const [offset, setOffset] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (!ref.current) return;
    
    const element = ref.current;
    let ticking = false;
    let animationFrameId: number;
    let targetOffset = 0;
    let currentOffset = 0;
    
    const checkVisibility = () => {
      if (!element) return false;
      
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      return (
        rect.top < windowHeight &&
        rect.bottom > 0
      );
    };
    
    const calculateParallax = () => {
      if (!element) return;
      
      // Calculate how far the element is from the top of the viewport
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const elementCenter = rect.top + rect.height / 2;
      const windowCenter = windowHeight / 2;
      const distanceFromCenter = elementCenter - windowCenter;
      
      // Calculate the parallax offset
      targetOffset = distanceFromCenter * speed * (reverse ? 1 : -1);
    };
    
    const updatePosition = () => {
      // Apply easing to the movement
      currentOffset += (targetOffset - currentOffset) * easing;
      
      // Apply the transform
      if (element) {
        const transform = direction === 'vertical' 
          ? `translateY(${currentOffset}px)` 
          : `translateX(${currentOffset}px)`;
          
        element.style.transform = transform;
      }
      
      // Continue the animation if the element is visible
      if (isVisible) {
        animationFrameId = requestAnimationFrame(updatePosition);
      }
    };
    
    const handleScroll = () => {
      // Check if element is visible
      const visible = checkVisibility();
      setIsVisible(visible);
      
      if (!visible) return;
      
      // Throttle calculations with requestAnimationFrame
      if (!ticking) {
        requestAnimationFrame(() => {
          calculateParallax();
          ticking = false;
        });
        ticking = true;
      }
    };
    
    // Initial calculations
    handleScroll();
    
    // Start animation loop if element is visible
    if (isVisible) {
      animationFrameId = requestAnimationFrame(updatePosition);
    }
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    
    // Clean up
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, [ref, speed, reverse, direction, easing, isVisible]);
  
  return { offset, isVisible };
} 