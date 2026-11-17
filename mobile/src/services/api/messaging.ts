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

export type MessageAttachment = {
  url: string;
  name: string;
  type: string;
  size?: number;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderType: "USER" | "STAFF";
  body: string;
  createdAt: string;
  readAt: string | null;
  attachments?: MessageAttachment[];
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
  const { data } = await apiClient.get(
    `/api/messages/conversations/${encodeURIComponent(id)}`
  );
  return data;
}

export async function markConversationRead(id: string): Promise<void> {
  await apiClient.patch(
    `/api/messages/conversations/${encodeURIComponent(id)}/read`
  );
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

export async function startPropertyConversation(input: {
  propertyId: string;
  body: string;
}): Promise<{ conversation: ConversationSummary }> {
  const { data } = await apiClient.post("/api/messages/conversations", {
    subjectType: "PROPERTY",
    subjectId: input.propertyId,
    body: input.body,
  });
  return data;
}

export async function sendConversationMessage(
  conversationId: string,
  input: {
    body: string;
    attachments?: MessageAttachment[];
  }
): Promise<{ message: ChatMessage }> {
  const { data } = await apiClient.post(
    `/api/messages/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      body: input.body,
      attachments: input.attachments?.length ? input.attachments : undefined,
    }
  );
  return data;
}
