import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";

function FormSkeleton() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="mb-8 space-y-3 text-center">
        <div className="mx-auto h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mx-auto h-4 w-64 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-5">
        <div className="h-10 animate-pulse rounded-lg bg-muted" />
        <div className="h-10 animate-pulse rounded-lg bg-muted" />
        <div className="h-10 animate-pulse rounded-lg bg-primary/30" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Suspense fallback={<FormSkeleton />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
