"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.href)}`);
    }
  }, [status, router]);

  // Don't render anything until we're mounted and know the auth state
  if (!mounted || status === "loading") {
    return (
      <div className="w-full h-[70vh] flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-gray-500">Verifying your credentials...</p>
      </div>
    );
  }

  // Don't render children if user isn't authenticated
  if (status === "unauthenticated") {
    return (
      <div className="w-full h-[70vh] flex flex-col items-center justify-center">
        <p className="text-gray-500">Please sign in to access this page</p>
      </div>
    );
  }

  return <>{children}</>;
} 