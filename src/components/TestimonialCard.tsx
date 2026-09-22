import React from 'react';
import Image from 'next/image';
import { Star, Quote } from 'lucide-react';

interface TestimonialCardProps {
  name: string;
  role?: string;
  testimonial: string;
  rating?: number;
  avatar?: string;
  highlighted?: boolean;
}

export default function TestimonialCard({
  name,
  role,
  testimonial,
  rating = 5,
  avatar,
  highlighted = false
}: TestimonialCardProps) {
  return (
    <div className={`${highlighted ? 'spotlight' : ''} relative`}>
      <div className={`
        testimonial-card p-8 rounded-xl transition-all 
        ${highlighted 
          ? 'border-secondary bg-gradient-to-br from-secondary/5 to-secondary/10' 
          : 'border-gray-100 bg-white'
        }
        border hover-transform
      `}>
        {/* Quote icon */}
        <div className="absolute top-6 right-6 text-secondary/10">
          <Quote size={40} />
        </div>
        
        {/* Avatar and info */}
        <div className="flex items-center mb-6">
          {avatar ? (
            <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-secondary mr-4">
              <Image 
                src={avatar} 
                alt={name} 
                fill 
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-primary to-primary-light flex items-center justify-center text-white text-xl font-semibold mr-4">
              {name.charAt(0)}
            </div>
          )}
          
          <div>
            <h4 className="font-semibold text-primary">{name}</h4>
            {role && <p className="text-sm text-gray-500">{role}</p>}
          </div>
        </div>
        
        {/* Rating stars */}
        <div className="flex mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star 
              key={i} 
              size={18} 
              className={`${i < rating ? 'text-secondary fill-secondary' : 'text-gray-300'} mr-1`}
            />
          ))}
        </div>
        
        {/* Testimonial text */}
        <p className="text-gray-600 text-sm leading-relaxed mb-2">"{testimonial}"</p>
        
        {/* Decorative bottom line */}
        <div className="w-16 h-1 bg-gradient-to-r from-secondary to-secondary-light mt-6"></div>
      </div>
    </div>
  );
} 