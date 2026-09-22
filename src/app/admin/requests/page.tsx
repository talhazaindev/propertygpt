import { Metadata } from "next";
import { PropertyRequestsTable } from "@/components/admin/PropertyRequestsTable";

export const metadata: Metadata = {
  title: "Property Requests | Admin Dashboard",
  description: "Manage property requests from users",
};

export default function PropertyRequestsPage() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Property Requests</h1>
          <p className="mt-2 text-sm text-gray-700">
            View and manage property requests submitted by users
          </p>
        </div>
      </div>
      
      <div className="mt-6">
        <PropertyRequestsTable />
      </div>
    </div>
  );
} 