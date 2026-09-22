import React from 'react';

interface LoaderProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'white';
  text?: string;
  fullScreen?: boolean;
}

export function Loader({ 
  size = 'medium', 
  variant = 'primary',
  text,
  fullScreen = false
}: LoaderProps) {
  const sizeClass = {
    small: 'w-5 h-5 border-2',
    medium: 'w-8 h-8 border-2',
    large: 'w-12 h-12 border-3'
  }[size];
  
  const variantClass = {
    primary: 'border-t-primary',
    secondary: 'border-t-secondary',
    white: 'border-t-white'
  }[variant];
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
        <div className={`loader ${sizeClass} ${variantClass} rounded-full animate-spin border-t-2 border-solid`}></div>
        {text && <p className="mt-4 text-gray-600 animate-pulse">{text}</p>}
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`loader ${sizeClass} ${variantClass} rounded-full animate-spin border-t-2 border-solid`}></div>
      {text && <p className="mt-2 text-gray-600 animate-pulse text-sm">{text}</p>}
    </div>
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="property-card animate-pulse">
      <div className="h-56 w-full bg-gray-200"></div>
      <div className="p-5 bg-white">
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-5"></div>
        <div className="flex justify-between mb-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded w-full mt-3"></div>
      </div>
    </div>
  );
}

export function TextSkeleton({ lines = 3, width = 'full' }: { lines?: number; width?: 'full' | '3/4' | '1/2' | '1/4' }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className={`h-4 bg-gray-200 rounded w-${width} ${i !== lines - 1 ? 'mb-2' : ''}`}
        ></div>
      ))}
    </div>
  );
}

export function ImageSkeleton({ aspectRatio = '16/9' }: { aspectRatio?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded relative`} style={{ aspectRatio }}>
      <div className="absolute inset-0 loading-shimmer"></div>
    </div>
  );
} 