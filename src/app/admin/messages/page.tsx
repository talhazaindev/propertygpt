"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessagingInbox } from "@/components/messaging/MessagingInbox";
import { Loader2 } from "lucide-react";

export default function AdminMessagesPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem("adminUser");
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    if (!isAdmin || !raw) {
      router.push("/admin/login");
      return;
    }
    try {
      const user = JSON.parse(raw) as { role?: string };
      if (user.role === "SUPER_ADMIN" || user.role === "CUSTOMER_SUPPORT") {
        setAllowed(true);
      } else {
        router.push("/admin");
      }
    } catch {
      router.push("/admin/login");
    } finally {
      setChecking(false);
    }
  }, [router]);

  if (checking || !allowed) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
        <p className="text-sm text-slate-600">
          Customer support inbox — auto-assigned by load, with manual reassignment.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        }
      >
        <MessagingInbox mode="admin" />
      </Suspense>
    </div>
  );
}
