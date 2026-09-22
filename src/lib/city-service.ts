import { cache } from "react";
import { prisma } from "@/lib/prisma";

export type City = {
  id: string;
  name: string;
  province: string;
};

/**
 * Fetch cities from the database (server) or public API (client).
 * Never returns hardcoded mock cities — fails loudly if data is unavailable.
 */
export const getCities = cache(async (): Promise<City[]> => {
  // Client components: call the API
  if (typeof window !== "undefined") {
    const response = await fetch("/api/cities");
    if (!response.ok) {
      throw new Error("Failed to fetch cities from API");
    }
    return await response.json();
  }

  // Server: query MongoDB via Prisma
  const cities = await prisma.city.findMany({
    select: { id: true, name: true, province: true },
    orderBy: { name: "asc" },
  });

  return cities;
});
