import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// Helper function to check if user is admin
async function isAdminOrStaff(req: NextRequest) {
  // OPTION 1: Check session-based authentication (NextAuth)
  const session = await getServerSession(authOptions);
  
  if (session?.user) {
    // Check if user is admin or staff
    if (session.user.role === "ADMIN") return true;
    
    // Check if user is a team member
    if (session.user.isTeamMember) return true;
    
    // Check if email has company domain
    if (typeof session.user.email === 'string' && session.user.email.includes("@propertygpt.com")) return true;
  }
  
  // OPTION 2: Check custom admin authentication header (for admin dashboard)
  const adminAuthHeader = req.headers.get('x-admin-auth');
  if (adminAuthHeader === 'true') {
    return true;
  }
  
  return false;
}

// GET /api/admin/dashboard - Get dashboard stats
export async function GET(request: NextRequest) {
  try {
    // Check admin access
    if (!await isAdminOrStaff(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    
    // Prepare default response with safe values
    let dashboardStats: {
      totalProperties: number;
      totalUsers: number;
      pendingVerifications: number;
      recentListings: number;
      propertiesWithOwnerIssues: number;
      activeListings: number;
      soldProperties: number;
      teamMembers: number;
      recentActivities: Array<{
        id: string;
        type: string;
        title: string;
        subtitle: string;
        timestamp: string;
        timeAgo: string;
      }>;
    } = {
      totalProperties: 0,
      totalUsers: 0,
      pendingVerifications: 0,
      recentListings: 0,
      propertiesWithOwnerIssues: 0,
      activeListings: 0,
      soldProperties: 0,
      teamMembers: 0,
      recentActivities: [],
    };
    
    try {
      // Get total properties count
      dashboardStats.totalProperties = await prisma.property.count();
    } catch (err) {
      console.error("Error counting properties:", err);
    }
    
    try {
      // Get total users count
      dashboardStats.totalUsers = await prisma.user.count();
    } catch (err) {
      console.error("Error counting users:", err);
    }
    
    try {
      // Get pending verification count
      dashboardStats.pendingVerifications = await prisma.property.count({
        where: { status: "PENDING" }
      });
    } catch (err) {
      console.error("Error counting pending verifications:", err);
    }
    
    try {
      // Get recent listings count (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      dashboardStats.recentListings = await prisma.property.count({
        where: {
          createdAt: {
            gte: oneWeekAgo
          }
        }
      });
    } catch (err) {
      console.error("Error counting recent listings:", err);
    }
    
    try {
      // Get properties with owner issues more safely
      // First check if there are any properties
      const propertiesCount = await prisma.property.count();
      
      if (propertiesCount > 0) {
        // Get all properties with their owners with error handling
        const propertiesWithOwners = await prisma.property.findMany({
          select: {
            id: true,
            ownerId: true,
            owner: {
              select: {
                id: true
              }
            }
          }
        });
        
        // Count properties with missing owners
        dashboardStats.propertiesWithOwnerIssues = propertiesWithOwners.filter(
          property => !property.owner || !property.ownerId
        ).length;
      }
    } catch (err) {
      console.error("Error checking properties with owner issues:", err);
      // Leave the default value of 0
    }

    try {
      dashboardStats.activeListings = await prisma.property.count({
        where: { status: { in: ["ACTIVE", "VERIFIED"] } },
      });
    } catch (err) {
      console.error("Error counting active listings:", err);
    }

    try {
      dashboardStats.soldProperties = await prisma.property.count({
        where: { status: "SOLD" },
      });
    } catch (err) {
      console.error("Error counting sold properties:", err);
    }

    try {
      dashboardStats.teamMembers = await prisma.teamMember.count();
    } catch (err) {
      console.error("Error counting team members:", err);
    }

    try {
      const formatTimeAgo = (date: Date): string => {
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
        if (seconds < 60) return "just now";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
      };

      const [recentUsers, recentProperties] = await Promise.all([
        prisma.user.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, name: true, email: true, createdAt: true },
        }),
        prisma.property.findMany({
          orderBy: { updatedAt: "desc" },
          take: 10,
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
      ]);

      const activities: typeof dashboardStats.recentActivities = [];

      for (const user of recentUsers) {
        activities.push({
          id: `user-${user.id}`,
          type: "user_registered",
          title: "New user registered",
          subtitle: `${user.name || "User"} - ${user.email}`,
          timestamp: user.createdAt.toISOString(),
          timeAgo: formatTimeAgo(user.createdAt),
        });
      }

      for (const property of recentProperties) {
        let type = "property_listed";
        let title = "New property submitted";
        if (property.status === "VERIFIED" || property.status === "ACTIVE") {
          type = "property_approved";
          title = "Property approved";
        } else if (property.status === "SOLD") {
          type = "property_sold";
          title = "Property marked as sold";
        } else if (property.status === "REJECTED") {
          type = "property_rejected";
          title = "Property rejected";
        }

        activities.push({
          id: `property-${property.id}-${property.status}`,
          type,
          title,
          subtitle: property.title,
          timestamp: property.updatedAt.toISOString(),
          timeAgo: formatTimeAgo(property.updatedAt),
        });
      }

      dashboardStats.recentActivities = activities
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, 8);
    } catch (err) {
      console.error("Error building recent activities:", err);
    }
    
    return NextResponse.json(dashboardStats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    // Return a basic response to avoid 500 error
    return NextResponse.json({
      totalProperties: 0,
      totalUsers: 0,
      pendingVerifications: 0,
      recentListings: 0,
      propertiesWithOwnerIssues: 0,
      activeListings: 0,
      soldProperties: 0,
      teamMembers: 0,
      recentActivities: [],
      error: "Error fetching dashboard stats"
    });
  }
} 