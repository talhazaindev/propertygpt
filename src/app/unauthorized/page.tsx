import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold text-red-600">Access Denied</h1>
        
        <div className="mt-4">
          <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-4V3" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17h6l3-6-3-6H9l-3 6 3 6z" />
          </svg>
        </div>
        
        <p className="mt-2 text-gray-600">
          You don't have permission to access this page.
        </p>
        
        <div className="mt-6">
          <Link 
            href="/"
            className="inline-block bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 