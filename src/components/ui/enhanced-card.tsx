import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface EnhancedCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'luxury' | 'glass' | 'gradient' | 'bordered';
  hover?: 'lift' | 'glow' | 'scale' | 'none';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: LucideIcon;
  iconColor?: string;
  title?: string;
  subtitle?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function EnhancedCard({
  children,
  className,
  variant = 'default',
  hover = 'lift',
  padding = 'lg',
  icon: Icon,
  iconColor = 'text-primary',
  title,
  subtitle,
  onClick,
  disabled = false
}: EnhancedCardProps) {
  const baseClasses = 'rounded-xl transition-all duration-300 ease-out relative overflow-hidden';
  
  const variantClasses = {
    default: 'bg-white border border-gray-200 shadow-sm',
    luxury: 'bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-lg',
    glass: 'bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg',
    gradient: 'bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10',
    bordered: 'bg-white border-2 border-gray-100'
  };

  const hoverClasses = {
    lift: 'hover:shadow-xl hover:-translate-y-2 hover:shadow-primary/10',
    glow: 'hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/30',
    scale: 'hover:scale-105',
    none: ''
  };

  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };

  const isClickable = onClick && !disabled;

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        hoverClasses[hover],
        paddingClasses[padding],
        isClickable && 'cursor-pointer group',
        disabled && 'opacity-50 cursor-not-allowed',
        'reveal',
        className
      )}
      onClick={isClickable ? onClick : undefined}
    >
      {/* Decorative top border for luxury variant */}
      {variant === 'luxury' && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary to-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
      )}

      {/* Icon section */}
      {Icon && (
        <div className="mb-4 flex justify-center">
          <div className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300',
            variant === 'gradient' ? 'bg-white/50' : 'bg-primary/10',
            'group-hover:scale-110 group-hover:bg-primary/20'
          )}>
            <Icon className={cn('w-8 h-8', iconColor, 'group-hover:text-primary')} />
          </div>
        </div>
      )}

      {/* Title and subtitle */}
      {(title || subtitle) && (
        <div className="mb-4 text-center">
          {title && (
            <h3 className="text-xl font-semibold mb-2 text-gray-900 group-hover:text-primary transition-colors">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-gray-600 text-sm">{subtitle}</p>
          )}
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Shine effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/10 to-transparent group-hover:animate-shine" />
      </div>
    </div>
  );
} 