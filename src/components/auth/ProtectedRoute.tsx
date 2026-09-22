"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { User } from "next-auth";

interface ExtendedUser extends User {
  role?: string;
  id?: string;
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles = []
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until auth state is determined
    if (isLoading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Check role-based access if roles are specified
    if (allowedRoles.length > 0 && user?.role && !allowedRoles.includes(user.role)) {
      router.push("/unauthorized");
    }
  }, [isAuthenticated, isLoading, router, allowedRoles, user]);

  // Show nothing while loading or redirecting
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check role-based access
  if (allowedRoles.length > 0 && user?.role && !allowedRoles.includes(user.role)) {
    return null; // Will redirect in the useEffect
  }

  // User is authenticated and has proper role, show the protected content
  return <>{children}</>;
} 