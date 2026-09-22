import { Metadata } from "next";
import { ConstructionRequestsTable } from "@/components/admin/ConstructionRequestsTable";

export const metadata: Metadata = {
  title: "Construction Requests | Admin Dashboard",
  description: "Manage construction requests from users",
};

export default function ConstructionRequestsPage() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Construction Requests</h1>
          <p className="mt-2 text-sm text-gray-700">
            View and manage construction requests submitted by users interested in hiring us for construction projects.
          </p>
        </div>
      </div>
      
      <div className="mt-6">
        <ConstructionRequestsTable />
      </div>
    </div>
  );
} 