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

export type ConstructionRequestPayload = {
  name: string;
  email: string;
  phone: string;
  city: string;
  budget: number;
  projectType: string;
  landArea: number;
  floors?: number;
  bedrooms?: number;
  bathrooms?: number;
  hasBlueprint: boolean;
  timeline?: string;
  additionalDetails?: string;
  status?: "PENDING";
};

export async function submitConstructionRequest(
  payload: ConstructionRequestPayload
): Promise<{ id: string }> {
  const { data } = await apiClient.post("/api/construction", {
    ...payload,
    status: "PENDING",
  });
  return { id: String(data.id || "") };
}
