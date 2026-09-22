import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { EnhancedButton } from './enhanced-button';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  background?: 'white' | 'gradient' | 'dark' | 'image';
  backgroundImage?: string;
  className?: string;
  centerContent?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  background = 'gradient',
  backgroundImage,
  className,
  centerContent = false
}: PageHeaderProps) {
  const backgroundClasses = {
    white: 'bg-white border-b border-gray-200',
    gradient: 'bg-gradient-to-r from-primary via-primary-dark to-primary',
    dark: 'bg-gray-900',
    image: 'bg-cover bg-center relative'
  };

  const textColorClasses = {
    white: 'text-gray-900',
    gradient: 'text-white',
    dark: 'text-white',
    image: 'text-white'
  };

  return (
    <div 
      className={cn(
        'relative py-12 md:py-16',
        backgroundClasses[background],
        className
      )}
      style={background === 'image' && backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : undefined}
    >
      {/* Background overlay for image/gradient variants */}
      {(background === 'image' || background === 'gradient') && (
        <div className="absolute inset-0 bg-black/20" />
      )}

      {/* Decorative elements */}
      {background === 'gradient' && (
        <>
          <div className="absolute inset-0 bg-[url('/images/pattern.png')] opacity-10 bg-repeat" />
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary-dark via-secondary to-secondary-light" />
        </>
      )}

      <div className="relative z-10 container mx-auto px-4">
        <div className={cn(
          'flex flex-col',
          centerContent ? 'text-center' : 'md:flex-row md:items-center md:justify-between'
        )}>
          <div className={cn('flex-1', centerContent && 'max-w-4xl mx-auto')}>
            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
              <nav className="mb-4">
                <ol className="flex items-center space-x-2 text-sm">
                  <li>
                    <Link 
                      href="/" 
                      className={cn(
                        'flex items-center hover:underline transition-colors',
                        textColorClasses[background],
                        'opacity-80 hover:opacity-100'
                      )}
                    >
                      <Home className="w-4 h-4 mr-1" />
                      Home
                    </Link>
                  </li>
                  {breadcrumbs.map((item, index) => (
                    <li key={index} className="flex items-center">
                      <ChevronRight className={cn('w-4 h-4 mx-2', textColorClasses[background], 'opacity-60')} />
                      {item.href ? (
                        <Link 
                          href={item.href}
                          className={cn(
                            'hover:underline transition-colors',
                            textColorClasses[background],
                            'opacity-80 hover:opacity-100'
                          )}
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <span className={cn(textColorClasses[background], 'opacity-100 font-medium')}>
                          {item.label}
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            {/* Title */}
            <h1 className={cn(
              'text-3xl md:text-4xl lg:text-5xl font-bold mb-4 animate-fade-in',
              textColorClasses[background]
            )}>
              {title.split(' ').map((word, index, arr) => (
                index === arr.length - 1 ? (
                  <span key={index} className="gradient-text">{word}</span>
                ) : (
                  <span key={index}>{word} </span>
                )
              ))}
            </h1>

            {/* Subtitle */}
            {subtitle && (
              <p className={cn(
                'text-lg md:text-xl max-w-3xl animate-slide-up delay-200',
                textColorClasses[background],
                background !== 'white' ? 'opacity-90' : 'text-gray-600',
                centerContent && 'mx-auto'
              )}>
                {subtitle}
              </p>
            )}
          </div>

          {/* Actions */}
          {actions && (
            <div className={cn(
              'mt-6 md:mt-0 md:ml-8 animate-slide-in-right delay-300',
              centerContent && 'md:ml-0 md:mt-8'
            )}>
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 