"use client";

import { Suspense } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { PageHeader } from "@/components/ui/page-header";
import { EnhancedSection } from "@/components/ui/enhanced-section";
import { MessagingInbox } from "@/components/messaging/MessagingInbox";
import { Loader2 } from "lucide-react";

export default function InboxPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <PageHeader
          title="Inbox"
          subtitle="Message Manzil support about your listings, requests, or general questions."
        />
        <EnhancedSection>
          <Suspense
            fallback={
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <MessagingInbox mode="user" />
          </Suspense>
        </EnhancedSection>
      </div>
    </ProtectedRoute>
  );
}
