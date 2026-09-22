"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { loginSchema, LoginFormValues } from "@/schemas/auth";
import { useAuth } from "@/hooks/useAuth";
import { EnhancedSection } from "@/components/ui/enhanced-section";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { Mail, Lock, Eye, EyeOff, UserCheck, Shield, ArrowRight } from "lucide-react";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const { login, loading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    // Redirect if user is already authenticated
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

  const onSubmit = async (data: LoginFormValues) => {
    const result = await login(data);
    
    if (result.success) {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/5 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-pattern-animated opacity-30"></div>
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 8 }).map((_, i) => {
          const particles = [
            { left: '10%', top: '20%', duration: '7s' },
            { left: '85%', top: '15%', duration: '9s' },
            { left: '25%', top: '75%', duration: '8s' },
            { left: '70%', top: '60%', duration: '10s' },
            { left: '45%', top: '35%', duration: '6s' },
            { left: '15%', top: '80%', duration: '8.5s' },
            { left: '80%', top: '85%', duration: '7.5s' },
            { left: '55%', top: '10%', duration: '9.5s' }
          ];
          
          return (
            <div
              key={i}
              className="absolute w-2 h-2 bg-primary/20 rounded-full floating-animation"
              style={{
                left: particles[i].left,
                top: particles[i].top,
                animationDelay: `${i * 0.5}s`,
                animationDuration: particles[i].duration
              }}
            />
          );
        })}
      </div>

      <EnhancedSection 
        fullHeight 
        centerContent 
        background="transparent" 
        padding="lg"
        className="relative z-10"
      >
        <div className="w-full max-w-md mx-auto">
          <EnhancedCard variant="luxury" hover="glow" className="reveal">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg animate-glow">
                    <UserCheck className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-secondary rounded-full flex items-center justify-center">
                    <Shield className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>
              
              <h1 className="text-3xl font-bold mb-2">
                Welcome <span className="gradient-text">Back</span>
              </h1>
              <p className="text-gray-600">
                Sign in to access your PropertyGPT account and manage your properties
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg animate-shake">
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-2 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">!</span>
                  </div>
                  <span className="text-sm font-medium">{error}</span>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-primary" />
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    {...register("email")}
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    className={`w-full px-4 py-3 border rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary ${
                      errors.email 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300 bg-white hover:border-gray-400 focus:bg-white'
                    }`}
                  />
                  {errors.email && (
                    <div className="absolute right-3 top-3">
                      <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">!</span>
                      </div>
                    </div>
                  )}
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600 animate-slide-up">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 flex items-center">
                  <Lock className="w-4 h-4 mr-2 text-primary" />
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className={`w-full px-4 py-3 pr-12 border rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary ${
                      errors.password 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300 bg-white hover:border-gray-400 focus:bg-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  {errors.password && (
                    <div className="absolute right-10 top-3">
                      <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">!</span>
                      </div>
                    </div>
                  )}
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 animate-slide-up">{errors.password.message}</p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded transition-all"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>

                <Link 
                  href="/forgot-password" 
                  className="text-sm font-medium text-primary hover:text-primary-dark transition-colors hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>

              {/* Submit Button */}
              <EnhancedButton
                type="submit"
                variant="gradient"
                size="lg"
                fullWidth
                loading={loading}
                icon={ArrowRight}
                iconPosition="right"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </EnhancedButton>
            </form>

            {/* Divider */}
            <div className="my-8 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">New to PropertyGPT?</span>
              </div>
            </div>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link 
                  href="/register" 
                  className="font-semibold text-primary hover:text-primary-dark transition-colors hover:underline inline-flex items-center"
                >
                  Create Account
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Link>
              </p>
            </div>
          </EnhancedCard>

          {/* Additional Features */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 reveal-stagger">
            <EnhancedCard variant="glass" hover="scale" padding="md" className="text-center">
              <Shield className="w-6 h-6 text-primary mx-auto mb-2" />
              <h4 className="font-semibold text-gray-900 mb-1">Secure Login</h4>
              <p className="text-xs text-gray-600">Your data is protected with enterprise-grade security</p>
            </EnhancedCard>
            
            <EnhancedCard variant="glass" hover="scale" padding="md" className="text-center">
              <UserCheck className="w-6 h-6 text-secondary mx-auto mb-2" />
              <h4 className="font-semibold text-gray-900 mb-1">Verified Users</h4>
              <p className="text-xs text-gray-600">Join thousands of verified property owners and buyers</p>
            </EnhancedCard>
          </div>
        </div>
      </EnhancedSection>
    </div>
  );
} 