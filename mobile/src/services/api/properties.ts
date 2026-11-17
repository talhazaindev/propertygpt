import { apiClient } from "@/src/services/api/client";

export type PropertyListItem = {
  id: string;
  title: string;
  description?: string;
  price: number;
  type: string;
  listingType: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number;
  address: string;
  status: string;
  featured: boolean;
  images: string[];
  city?: { id: string; name: string; province: string } | null;
  rejectionReason?: string | null;
  createdAt?: string;
};

export type PropertyDetail = PropertyListItem & {
  description: string;
  contactPhone?: string | null;
  owner?: {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    phone?: string | null;
    image?: string | null;
    role?: string | null;
  } | null;
  hasVerificationDocuments?: boolean;
  verifiedAt?: string | null;
};

export type PropertyListResponse = {
  properties: PropertyListItem[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
};

export type PropertyTypeFilter =
  | "ALL"
  | "HOUSE"
  | "APARTMENT"
  | "VILLA"
  | "LAND"
  | "COMMERCIAL";

export type SortOption = "newest" | "oldest" | "price_low" | "price_high";

export type MyListingStatusFilter =
  | "ALL"
  | "PENDING"
  | "VERIFIED"
  | "REJECTED"
  | "ACTIVE"
  | "SOLD"
  | "HIDDEN";

export async function fetchProperties(params: {
  listingType?: "SALE" | "RENTAL";
  type?: Exclude<PropertyTypeFilter, "ALL">;
  bedrooms?: number;
  search?: string;
  sortBy?: SortOption;
  featured?: boolean;
  page?: number;
  limit?: number;
}): Promise<PropertyListResponse> {
  const { data } = await apiClient.get<PropertyListResponse>("/api/properties", {
    params: {
      listingType: params.listingType,
      type: params.type,
      bedrooms: params.bedrooms,
      search: params.search || undefined,
      sortBy: params.sortBy || "newest",
      featured: params.featured ? "true" : undefined,
      page: params.page || 1,
      limit: params.limit || 20,
      status: "VERIFIED,ACTIVE",
    },
  });
  return data;
}

export async function fetchPropertyById(id: string): Promise<PropertyDetail> {
  const { data } = await apiClient.get<PropertyDetail>(`/api/properties/${id}`);
  return data;
}

export async function fetchMyProperties(params?: {
  status?: Exclude<MyListingStatusFilter, "ALL"> | string;
  page?: number;
  limit?: number;
}): Promise<PropertyListResponse> {
  const { data } = await apiClient.get<PropertyListResponse>("/api/properties/mine", {
    params: {
      status: params?.status,
      page: params?.page || 1,
      limit: params?.limit || 20,
    },
  });
  return data;
}

export async function fetchCities(): Promise<
  Array<{ id: string; name: string; province: string }>
> {
  const { data } = await apiClient.get("/api/cities");
  return Array.isArray(data) ? data : [];
}

export type PropertyOwnerUpdatePayload = {
  title?: string;
  description?: string;
  price?: number;
  type?: string;
  listingType?: "SALE" | "RENTAL";
  bedrooms?: number | null;
  bathrooms?: number | null;
  area?: number;
  address?: string;
  cityId?: string;
  imageUrls?: string[];
};

export async function updateProperty(
  id: string,
  payload: PropertyOwnerUpdatePayload
): Promise<void> {
  await apiClient.patch(`/api/properties/${encodeURIComponent(id)}`, payload);
}

export async function deleteProperty(id: string): Promise<void> {
  await apiClient.delete(`/api/properties/${encodeURIComponent(id)}`);
}
