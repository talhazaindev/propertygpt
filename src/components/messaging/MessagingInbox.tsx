"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Loader2,
  MessageSquare,
  Paperclip,
  Send,
  Plus,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { uploadFiles } from "@/lib/uploadthing";
import { messagingFetch } from "@/lib/messaging-client";
import { useMessagingPolling } from "@/hooks/useMessagingPolling";

export type ConversationDTO = {
  id: string;
  subjectType: string;
  subjectLabel: string | null;
  subjectId: string | null;
  status: string;
  userId: string;
  user?: { id: string; name: string | null; email: string } | null;
  assignedToId: string | null;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  lastMessageAt: string | null;
  lastPreview: string | null;
  userUnreadCount: number;
  staffUnreadCount: number;
};

export type MessageDTO = {
  id: string;
  conversationId: string;
  senderType: "USER" | "STAFF";
  body: string;
  attachments: { url: string; name: string; type: string; size?: number }[];
  createdAt: string;
};

type AttachmentDraft = {
  url: string;
  name: string;
  type: string;
  size?: number;
};

type Props = {
  mode: "user" | "admin";
};

const SUBJECT_OPTIONS = [
  { value: "GENERAL", label: "General support" },
  { value: "PROPERTY", label: "Property listing" },
  { value: "PROPERTY_REQUEST", label: "Property request" },
  { value: "AGENT_REQUEST", label: "Agent request" },
] as const;

export function MessagingInbox({ mode }: Props) {
  const searchParams = useSearchParams();
  const asAdmin = mode === "admin";

  const [conversations, setConversations] = useState<ConversationDTO[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<AttachmentDraft[]>([]);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [showNew, setShowNew] = useState(false);
  const [agents, setAgents] = useState<
    { id: string; name: string; email: string; role: string; openChats: number; unread: number }[]
  >([]);

  // New conversation form
  const [newSubjectType, setNewSubjectType] =
    useState<(typeof SUBJECT_OPTIONS)[number]["value"]>("GENERAL");
  const [newSubjectId, setNewSubjectId] = useState("");
  const [newBody, setNewBody] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<
    { id: string; name: string | null; email: string }[]
  >([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userProperties, setUserProperties] = useState<
    { id: string; title: string; label: string; status: string }[]
  >([]);
  const [loadingProperties, setLoadingProperties] = useState(false);

  const loadConversations = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent === true;
      if (!silent) setLoadingList(true);
      try {
        const qs = asAdmin ? `?filter=${filter}` : "";
        const res = await messagingFetch(
          `/api/messages/conversations${qs}`,
          {},
          asAdmin
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load");
        setConversations(data.conversations || []);
      } catch (e) {
        if (!silent) {
          toast.error(e instanceof Error ? e.message : "Failed to load inbox");
        }
      } finally {
        if (!silent) setLoadingList(false);
      }
    },
    [asAdmin, filter]
  );

  const loadThread = useCallback(
    async (id: string, opts?: { silent?: boolean; markRead?: boolean }) => {
      const silent = opts?.silent === true;
      const markRead = opts?.markRead !== false;
      if (!silent) setLoadingThread(true);
      try {
        const res = await messagingFetch(
          `/api/messages/conversations/${id}`,
          {},
          asAdmin
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load thread");

        const nextMessages: MessageDTO[] = data.messages || [];
        setMessages((prev) => {
          if (silent && prev.length === nextMessages.length) {
            const lastPrev = prev[prev.length - 1]?.id;
            const lastNext = nextMessages[nextMessages.length - 1]?.id;
            if (lastPrev === lastNext) return prev;
          }
          return nextMessages;
        });

        if (data.conversation) {
          setConversations((prev) => {
            const rest = prev.filter((c) => c.id !== data.conversation.id);
            return [data.conversation, ...rest];
          });
        }

        if (markRead) {
          await messagingFetch(
            `/api/messages/conversations/${id}/read`,
            { method: "PATCH" },
            asAdmin
          );
          setConversations((prev) =>
            prev.map((c) =>
              c.id === id
                ? {
                    ...c,
                    ...(asAdmin
                      ? { staffUnreadCount: 0 }
                      : { userUnreadCount: 0 }),
                  }
                : c
            )
          );
        }
      } catch (e) {
        if (!silent) {
          toast.error(
            e instanceof Error ? e.message : "Failed to load messages"
          );
        }
      } finally {
        if (!silent) setLoadingThread(false);
      }
    },
    [asAdmin]
  );

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const fromQuery = searchParams.get("c");
    if (fromQuery) {
      setActiveId(fromQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeId) {
      void loadThread(activeId, { markRead: true });
    } else {
      setMessages([]);
    }
  }, [activeId, loadThread]);

  useEffect(() => {
    if (!asAdmin) return;
    void (async () => {
      try {
        const res = await messagingFetch(
          "/api/messages/support-agents",
          {},
          true
        );
        const data = await res.json();
        if (res.ok) setAgents(data.agents || []);
      } catch {
        /* ignore */
      }
    })();
  }, [asAdmin]);

  // Load user's posted properties for PROPERTY subject dropdown
  useEffect(() => {
    if (!showNew || newSubjectType !== "PROPERTY") {
      return;
    }
    if (asAdmin && !selectedUserId) {
      setUserProperties([]);
      return;
    }

    let cancelled = false;
    void (async () => {
      setLoadingProperties(true);
      try {
        const qs =
          asAdmin && selectedUserId
            ? `?userId=${encodeURIComponent(selectedUserId)}`
            : "";
        const res = await messagingFetch(
          `/api/messages/user-properties${qs}`,
          {},
          asAdmin
        );
        const data = await res.json();
        if (cancelled) return;
        if (res.ok) {
          setUserProperties(data.properties || []);
        } else {
          setUserProperties([]);
        }
      } catch {
        if (!cancelled) setUserProperties([]);
      } finally {
        if (!cancelled) setLoadingProperties(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [showNew, newSubjectType, asAdmin, selectedUserId]);

  // Primary live updates for Vercel: poll list + open thread
  useMessagingPolling({
    enabled: true,
    intervalMs: 4000,
    activeConversationId: activeId,
    refreshList: () => loadConversations({ silent: true }),
    refreshThread: activeId
      ? () => loadThread(activeId, { silent: true, markRead: true })
      : undefined,
  });

  const activeConversation = conversations.find((c) => c.id === activeId);

  async function handleSend() {
    if (!activeId || (!draft.trim() && attachments.length === 0)) return;
    setSending(true);
    try {
      const res = await messagingFetch(
        `/api/messages/conversations/${activeId}/messages`,
        {
          method: "POST",
          body: JSON.stringify({ body: draft, attachments }),
        },
        asAdmin
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setMessages((prev) => [...prev, data.message]);
      if (data.conversation) {
        setConversations((prev) => {
          const rest = prev.filter((c) => c.id !== data.conversation.id);
          return [data.conversation, ...rest];
        });
      }
      setDraft("");
      setAttachments([]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const result = await uploadFiles("messageAttachments", {
        files: Array.from(files),
      });
      const next = result.map((f) => ({
        url: f.ufsUrl || f.url,
        name: f.name,
        type: f.type || "application/octet-stream",
        size: f.size,
      }));
      setAttachments((prev) => [...prev, ...next]);
      toast.success("Attachment uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleCreate() {
    if (!newBody.trim()) {
      toast.error("Enter a message");
      return;
    }
    if (asAdmin && !selectedUserId) {
      toast.error("Select a user");
      return;
    }
    if (newSubjectType === "PROPERTY" && !newSubjectId.trim()) {
      toast.error("Select a property");
      return;
    }
    if (
      newSubjectType !== "GENERAL" &&
      newSubjectType !== "PROPERTY" &&
      !newSubjectId.trim()
    ) {
      toast.error("Enter the related record ID");
      return;
    }
    try {
      const res = await messagingFetch(
        "/api/messages/conversations",
        {
          method: "POST",
          body: JSON.stringify({
            subjectType: newSubjectType,
            subjectId:
              newSubjectType === "GENERAL" ? null : newSubjectId.trim(),
            body: newBody,
            ...(asAdmin ? { userId: selectedUserId } : {}),
          }),
        },
        asAdmin
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start chat");
      setShowNew(false);
      setNewBody("");
      setNewSubjectId("");
      setSelectedUserId(null);
      setUserProperties([]);
      await loadConversations();
      setActiveId(data.conversation.id);
      toast.success("Conversation started");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start");
    }
  }

  async function searchUsers(q: string) {
    setUserQuery(q);
    if (q.trim().length < 2) {
      setUserResults([]);
      return;
    }
    const res = await messagingFetch(
      `/api/messages/users/search?q=${encodeURIComponent(q)}`,
      {},
      true
    );
    const data = await res.json();
    if (res.ok) setUserResults(data.users || []);
  }

  async function handleAssign(assignedToId: string) {
    if (!activeId) return;
    try {
      const res = await messagingFetch(
        `/api/messages/conversations/${activeId}/assign`,
        {
          method: "PATCH",
          body: JSON.stringify({ assignedToId }),
        },
        true
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Assign failed");
      setConversations((prev) =>
        prev.map((c) => (c.id === data.conversation.id ? data.conversation : c))
      );
      toast.success("Conversation assigned");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Assign failed");
    }
  }

  const unreadFor = (c: ConversationDTO) =>
    asAdmin ? c.staffUnreadCount : c.userUnreadCount;

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[520px] overflow-hidden rounded-xl border border-border bg-card">
      {/* List */}
      <aside className="flex w-full max-w-sm flex-col border-r border-border">
        <div className="flex items-center justify-between gap-2 border-b border-border p-4">
          <div>
            <h2 className="text-lg font-semibold">
              {asAdmin ? "Messages" : "Inbox"}
            </h2>
            <p className="text-xs text-muted-foreground">
              Support conversations
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> New
          </button>
        </div>

        {asAdmin && (
          <div className="flex gap-1 border-b border-border p-2">
            {["all", "mine", "unassigned"].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`flex-1 rounded-md px-2 py-1.5 text-xs capitalize ${
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-40" />
              No conversations yet
            </div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveId(c.id)}
                className={`w-full border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted/60 ${
                  activeId === c.id ? "bg-muted" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {c.subjectLabel || c.subjectType}
                    </p>
                    {asAdmin && c.user && (
                      <p className="truncate text-xs text-muted-foreground">
                        {c.user.name || c.user.email}
                      </p>
                    )}
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {c.lastPreview || "No messages yet"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {c.lastMessageAt && (
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(c.lastMessageAt), {
                          addSuffix: true,
                        })}
                      </span>
                    )}
                    {unreadFor(c) > 0 && (
                      <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                        {unreadFor(c)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Thread */}
      <section className="flex min-w-0 flex-1 flex-col">
        {!activeId ? (
          <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="mb-3 h-10 w-10 opacity-40" />
            <p>Select a conversation</p>
          </div>
        ) : (
          <>
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <h3 className="font-semibold">
                  {activeConversation?.subjectLabel || "Conversation"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {activeConversation?.subjectType}
                  {asAdmin && activeConversation?.user
                    ? ` · ${activeConversation.user.email}`
                    : ""}
                  {activeConversation?.assignedTo
                    ? ` · Assigned: ${activeConversation.assignedTo.name}`
                    : asAdmin
                      ? " · Unassigned"
                      : ""}
                </p>
              </div>
              {asAdmin && agents.length > 0 && (
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <UserPlus className="h-3.5 w-3.5" />
                  <select
                    className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground"
                    value={activeConversation?.assignedToId || ""}
                    onChange={(e) => {
                      if (e.target.value) void handleAssign(e.target.value);
                    }}
                  >
                    <option value="">Assign to…</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.role}) · {a.openChats} open / {a.unread} unread
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {loadingThread ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                messages.map((m) => {
                  const mine =
                    (asAdmin && m.senderType === "STAFF") ||
                    (!asAdmin && m.senderType === "USER");
                  return (
                    <div
                      key={m.id}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                          mine
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        {m.attachments?.length > 0 && (
                          <ul className="mt-2 space-y-1 border-t border-white/20 pt-2">
                            {m.attachments.map((a) => (
                              <li key={a.url}>
                                <a
                                  href={a.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 underline"
                                >
                                  <Paperclip className="h-3 w-3" />
                                  {a.name}
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                        <p
                          className={`mt-1 text-[10px] ${
                            mine ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}
                        >
                          {formatDistanceToNow(new Date(m.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <footer className="border-t border-border p-3">
              {attachments.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {attachments.map((a) => (
                    <span
                      key={a.url}
                      className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs"
                    >
                      <Paperclip className="h-3 w-3" />
                      {a.name}
                      <button
                        type="button"
                        className="ml-1 text-muted-foreground hover:text-foreground"
                        onClick={() =>
                          setAttachments((prev) =>
                            prev.filter((x) => x.url !== a.url)
                          )
                        }
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2">
                <label className="cursor-pointer rounded-lg border border-border p-2 hover:bg-muted">
                  <Paperclip className="h-4 w-4" />
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*,.pdf,.txt,.doc,.docx"
                    onChange={(e) => void handleUpload(e.target.files)}
                  />
                </label>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={2}
                  placeholder={uploading ? "Uploading…" : "Write a message…"}
                  className="min-h-[44px] flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                />
                <button
                  type="button"
                  disabled={sending || uploading}
                  onClick={() => void handleSend()}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send
                </button>
              </div>
            </footer>
          </>
        )}
      </section>

      {/* New conversation modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
            <h3 className="text-lg font-semibold">New conversation</h3>
            <div className="mt-4 space-y-3">
              {asAdmin && (
                <div>
                  <label className="text-xs text-muted-foreground">User</label>
                  <input
                    value={userQuery}
                    onChange={(e) => void searchUsers(e.target.value)}
                    placeholder="Search by name or email"
                    className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                  />
                  {userResults.length > 0 && (
                    <ul className="mt-1 max-h-32 overflow-y-auto rounded-md border border-border">
                      {userResults.map((u) => (
                        <li key={u.id}>
                          <button
                            type="button"
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-muted ${
                              selectedUserId === u.id ? "bg-muted" : ""
                            }`}
                            onClick={() => {
                              setSelectedUserId(u.id);
                              setUserQuery(u.email);
                              setUserResults([]);
                              setNewSubjectId("");
                            }}
                          >
                            {u.name || "—"} · {u.email}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <div>
                <label className="text-xs text-muted-foreground">Subject</label>
                <select
                  value={newSubjectType}
                  onChange={(e) => {
                    setNewSubjectType(
                      e.target.value as (typeof SUBJECT_OPTIONS)[number]["value"]
                    );
                    setNewSubjectId("");
                  }}
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                >
                  {SUBJECT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              {newSubjectType === "PROPERTY" && (
                <div>
                  <label className="text-xs text-muted-foreground">
                    Property
                  </label>
                  {asAdmin && !selectedUserId ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Select a user first to load their properties.
                    </p>
                  ) : loadingProperties ? (
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Loading properties…
                    </div>
                  ) : userProperties.length === 0 ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      No posted properties found for this account.
                    </p>
                  ) : (
                    <select
                      value={newSubjectId}
                      onChange={(e) => setNewSubjectId(e.target.value)}
                      className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                    >
                      <option value="">Select a property…</option>
                      {userProperties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              {newSubjectType !== "GENERAL" &&
                newSubjectType !== "PROPERTY" && (
                <div>
                  <label className="text-xs text-muted-foreground">
                    Related ID ({newSubjectType})
                  </label>
                  <input
                    value={newSubjectId}
                    onChange={(e) => setNewSubjectId(e.target.value)}
                    placeholder="Paste request ID"
                    className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                  />
                </div>
              )}
              <div>
                <label className="text-xs text-muted-foreground">Message</label>
                <textarea
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                  placeholder="Write your first message…"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNew(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleCreate()}
                className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
              >
                Start
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
