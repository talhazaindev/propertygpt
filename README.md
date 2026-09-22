# Real Estate GPT 🏡

A secure and reliable real estate platform for Pakistan that connects buyers and sellers while ensuring authentic and fraudless transactions.

## Features

- **Verified Listings**: All properties are verified by our team to ensure authenticity
- **Secure Transactions**: We act as intermediaries between buyers and sellers to prevent fraud
- **Nationwide Coverage**: Support for cities across Pakistan with local companies in major cities
- **Smart Property Search**: Find properties that match your requirements through our AI-powered search
- **Role-Based System**: Different interfaces for buyers, sellers, and administrators

## Tech Stack

- **Frontend**: Next.js, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: MongoDB
- **Authentication**: NextAuth.js
- **File Storage**: UploadThing
- **Deployment**: Vercel (or your preferred hosting)

## Project Structure

- `app/`: Next.js app directory containing pages and API routes
- `components/`: Reusable React components
- `lib/`: Utility functions and shared code
- `prisma/`: Database schema and Prisma client
- `public/`: Static assets
- `schemas/`: Zod validation schemas
- `types/`: TypeScript type definitions

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/real-estate-gpt.git
   cd real-estate-gpt
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL="mongodb://localhost:27017/propertygpt"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. Initialize the database:
   ```bash
   npx prisma db push
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

The application can be easily deployed on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Set the environment variables
4. Deploy

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Prisma](https://prisma.io/)
- [TailwindCSS](https://tailwindcss.com/)
- [MongoDB](https://mongodb.com/)
- [NextAuth.js](https://next-auth.js.org/)
