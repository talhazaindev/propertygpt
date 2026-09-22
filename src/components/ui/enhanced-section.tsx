import React from 'react';
import { cn } from '@/lib/utils';

interface EnhancedSectionProps {
  children: React.ReactNode;
  className?: string;
  background?: 'white' | 'gray' | 'gradient' | 'dark' | 'transparent';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  fullHeight?: boolean;
  centerContent?: boolean;
  animate?: boolean;
  id?: string;
}

export function EnhancedSection({
  children,
  className,
  background = 'white',
  padding = 'lg',
  fullHeight = false,
  centerContent = false,
  animate = true,
  id
}: EnhancedSectionProps) {
  const backgroundClasses = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    gradient: 'bg-gradient-to-br from-primary/5 via-white to-secondary/5',
    dark: 'bg-gradient-to-br from-primary-dark via-primary to-primary-dark text-white',
    transparent: 'bg-transparent'
  };

  const paddingClasses = {
    none: '',
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16 md:py-20',
    xl: 'py-20 md:py-28'
  };

  return (
    <section
      id={id}
      className={cn(
        'relative overflow-hidden',
        backgroundClasses[background],
        paddingClasses[padding],
        fullHeight && 'min-h-screen',
        centerContent && 'flex items-center',
        className
      )}
      data-animate={animate}
    >
      {/* Decorative elements for visual interest */}
      {background !== 'transparent' && (
        <>
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-30 pointer-events-none" />
          
          {/* Animated particles for dark sections */}
          {background === 'dark' && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: 6 }).map((_, i) => {
                const positions = [
                  { left: '10%', top: '20%' },
                  { left: '85%', top: '15%' },
                  { left: '25%', top: '75%' },
                  { left: '70%', top: '60%' },
                  { left: '45%', top: '35%' },
                  { left: '15%', top: '80%' }
                ];
                const durations = [8, 10, 9, 11, 8.5, 9.5];
                
                return (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-white/20 rounded-full floating-animation"
                    style={{
                      left: positions[i].left,
                      top: positions[i].top,
                      animationDelay: `${i * 0.5}s`,
                      animationDuration: `${durations[i]}s`
                    }}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Content container */}
      <div className="relative z-10 container mx-auto px-4">
        {centerContent ? (
          <div className="flex items-center justify-center min-h-full">
            <div className="w-full">{children}</div>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
} 