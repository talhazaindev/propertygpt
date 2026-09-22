"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/ui/page-header";
import { EnhancedSection } from "@/components/ui/enhanced-section";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import {
  Home,
  Heart,
  MessageSquare,
  Plus,
  Eye,
  Settings,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import axios from "axios";

interface DashboardStats {
  totalViews: number;
  savedProperties: number;
  messages: number;
  listingsActive: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalViews: 0,
    savedProperties: 0,
    messages: 0,
    listingsActive: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `/api/properties?userId=${user.id}&limit=1`
        );
        const listingsActive =
          response.data?.pagination?.total ??
          response.data?.total ??
          (Array.isArray(response.data?.properties)
            ? response.data.properties.length
            : 0);

        setStats({
          totalViews: 0,
          savedProperties: 0,
          messages: 0,
          listingsActive,
        });
      } catch (error) {
        console.error("Error loading dashboard stats:", error);
        setStats({
          totalViews: 0,
          savedProperties: 0,
          messages: 0,
          listingsActive: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user?.id]);

  const quickActions = [
    {
      title: "List Property",
      description: "Add a new property to our marketplace",
      icon: Plus,
      href: "/sell",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Search Properties",
      description: "Find your perfect property",
      icon: Search,
      href: "/properties",
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "My Requests",
      description: "View property requests you've made",
      icon: MessageSquare,
      href: "/my-requests",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Account Settings",
      description: "Manage your profile and preferences",
      icon: Settings,
      href: "/settings",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <PageHeader
          title={`Welcome back${user?.name ? `, ${user.name}` : ""}`}
          description="Manage your listings and account from your dashboard."
        />

        <EnhancedSection>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <EnhancedCard>
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                  <p className="text-2xl font-semibold">
                    {isLoading ? "—" : stats.totalViews}
                  </p>
                </div>
              </div>
            </EnhancedCard>
            <EnhancedCard>
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Saved</p>
                  <p className="text-2xl font-semibold">
                    {isLoading ? "—" : stats.savedProperties}
                  </p>
                </div>
              </div>
            </EnhancedCard>
            <EnhancedCard>
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Messages</p>
                  <p className="text-2xl font-semibold">
                    {isLoading ? "—" : stats.messages}
                  </p>
                </div>
              </div>
            </EnhancedCard>
            <EnhancedCard>
              <div className="flex items-center gap-3">
                <Home className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">My Listings</p>
                  <p className="text-2xl font-semibold">
                    {isLoading ? "—" : stats.listingsActive}
                  </p>
                </div>
              </div>
            </EnhancedCard>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {quickActions.map((action) => (
              <EnhancedCard key={action.href}>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${action.bgColor}`}>
                    <action.icon className={`h-5 w-5 ${action.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{action.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {action.description}
                    </p>
                    <Link href={action.href}>
                      <EnhancedButton variant="outline" size="sm">
                        Open
                      </EnhancedButton>
                    </Link>
                  </div>
                </div>
              </EnhancedCard>
            ))}
          </div>

          <EnhancedCard>
            <h3 className="font-semibold mb-2">Recent Activity</h3>
            <p className="text-sm text-muted-foreground">
              No recent activity yet. List a property or browse the marketplace
              to get started.
            </p>
            <div className="mt-4">
              <Link href="/sell/dashboard">
                <EnhancedButton variant="outline" size="sm">
                  View my listings
                </EnhancedButton>
              </Link>
            </div>
          </EnhancedCard>
        </EnhancedSection>
      </div>
    </ProtectedRoute>
  );
}
