import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface EnhancedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
  animation?: 'bounce' | 'pulse' | 'shake' | 'none';
}

export function EnhancedButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  rounded = 'lg',
  animation = 'none',
  disabled,
  ...props
}: EnhancedButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-300 ease-out relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed group';

  const variantClasses = {
    primary: 'bg-gradient-to-r from-primary to-primary-dark text-primary-foreground hover:from-primary-dark hover:to-primary shadow-lg hover:shadow-xl hover:shadow-primary/30 focus:ring-primary/50',
    secondary: 'bg-accent text-accent-foreground hover:opacity-90 shadow-lg hover:shadow-xl focus:ring-accent/50',
    outline: 'border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground focus:ring-primary/50',
    ghost: 'text-primary hover:bg-primary/10 hover:text-primary-dark focus:ring-primary/50',
    gradient: 'bg-gradient-to-r from-primary via-primary-light to-primary-dark bg-size-200 hover:bg-pos-100 text-primary-foreground shadow-lg hover:shadow-xl focus:ring-primary/50',
    glass: 'bg-white/10 backdrop-blur-sm border border-white/20 text-foreground hover:bg-white/20 focus:ring-primary/50'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };

  const roundedClasses = {
    sm: 'rounded-md',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    full: 'rounded-full'
  };

  const animationClasses = {
    bounce: 'hover:animate-bounce',
    pulse: 'hover:animate-pulse',
    shake: 'hover:animate-shake',
    none: ''
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        roundedClasses[rounded],
        animationClasses[animation],
        fullWidth && 'w-full',
        'transform hover:scale-105 active:scale-95',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {/* Shine effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/20 to-transparent group-hover:animate-shine" />
      </div>

      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />
        )}
        
        {children}
        
        {!loading && Icon && iconPosition === 'right' && (
          <Icon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        )}
      </span>
    </button>
  );
} 