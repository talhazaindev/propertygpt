// This file exports a base64 encoded SVG image to use as a placeholder
// when property images fail to load

// Simple gray box with "No Image" text
const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='480' viewBox='0 0 640 480'%3E%3Crect width='640' height='480' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui, sans-serif' font-size='24' font-weight='bold' fill='%2394a3b8'%3ENo Image Available%3C/text%3E%3C/svg%3E";

export default placeholderImage; 