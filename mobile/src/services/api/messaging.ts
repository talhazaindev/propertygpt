import { apiClient } from "@/src/services/api/client";

export type ConversationSummary = {
  id: string;
  subjectType: string;
  subjectKey: string;
  subjectId: string | null;
  subjectLabel: string | null;
  status: string;
  lastMessageAt: string | null;
  lastPreview: string | null;
  userUnreadCount: number;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderType: "USER" | "STAFF";
  body: string;
  createdAt: string;
  readAt: string | null;
};

export async function fetchConversations(): Promise<ConversationSummary[]> {
  const { data } = await apiClient.get<{ conversations: ConversationSummary[] }>(
    "/api/messages/conversations"
  );
  return data.conversations || [];
}

export async function fetchConversationThread(id: string): Promise<{
  conversation: ConversationSummary;
  messages: ChatMessage[];
}> {
  const { data } = await apiClient.get(`/api/messages/conversations/${id}`);
  return data;
}

export async function startSupportConversation(body: string): Promise<{
  conversation: ConversationSummary;
}> {
  const { data } = await apiClient.post("/api/messages/conversations", {
    subjectType: "GENERAL",
    body,
  });
  return data;
}

export async function sendConversationMessage(
  conversationId: string,
  body: string
): Promise<{ message: ChatMessage }> {
  const { data } = await apiClient.post(
    `/api/messages/conversations/${conversationId}/messages`,
    { body }
  );
  return data;
}
