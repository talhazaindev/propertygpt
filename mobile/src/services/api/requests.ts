import { apiClient } from "@/src/services/api/client";

export type PropertyRequestPayload = {
  name: string;
  email: string;
  phone: string;
  city: string;
  budget: number;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  additionalDetails?: string;
};

export async function submitPropertyRequest(
  payload: PropertyRequestPayload
): Promise<{ id: string }> {
  const { data } = await apiClient.post("/api/requests", payload);
  return { id: String(data.id || "") };
}
