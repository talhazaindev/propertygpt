import { Property, User, Company, City, UserRole, PropertyStatus, PropertyType } from "@prisma/client";

export type SafeUser = Omit<User, "hashedPassword"> & {
  createdAt: string;
  updatedAt: string;
};

export type SafeProperty = Omit<Property, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
  seller: SafeUser;
  buyer?: SafeUser;
  company: SafeCompany;
  city: SafeCity;
};

export type SafeCompany = Omit<Company, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
  city: SafeCity;
};

export type SafeCity = Omit<City, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export interface PropertyFilters {
  cityId?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  bedrooms?: number;
  propertyType?: PropertyType;
  status?: PropertyStatus;
}

export interface CompanyFilters {
  cityId?: string;
  isHeadquarter?: boolean;
}

export { UserRole, PropertyStatus, PropertyType }; 