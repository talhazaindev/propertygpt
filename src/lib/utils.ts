import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  if (price >= 10000000) {
    return `${(price / 10000000).toFixed(2)} Crore PKR`;
  } else if (price >= 100000) {
    return `${(price / 100000).toFixed(2)} Lac PKR`;
  } else {
    return `${price.toLocaleString()} PKR`;
  }
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
