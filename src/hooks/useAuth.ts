"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { RegisterFormValues, LoginFormValues } from "@/schemas/auth";

export const useAuth = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  /**
   * Register a new user
   */
  const register = async (data: RegisterFormValues) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/api/register', data);
      
      return {
        success: true,
        data: response.data,
      };
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || "An error occurred during registration";
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login a user
   */
  const login = async (data: LoginFormValues) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });
      
      if (result?.error) {
        setError(result.error);
        return {
          success: false,
          error: result.error,
        };
      }
      
      if (result?.ok) {
        return {
          success: true,
        };
      }
      
      return {
        success: false,
        error: "Unknown error occurred",
      };
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      return {
        success: false,
        error: err.message || "An unexpected error occurred",
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout the current user
   */
  const logout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };
  
  /**
   * Redirect to login page if user is not authenticated
   */
  const requireAuth = (callback?: () => void) => {
    if (status === "loading") return;
    
    if (!isAuthenticated) {
      router.push("/login");
    } else if (callback) {
      callback();
    }
  };

  return {
    user: session?.user,
    isAuthenticated,
    isLoading,
    loading,
    error,
    register,
    login,
    logout,
    requireAuth,
  };
}; 