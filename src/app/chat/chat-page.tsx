"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-sidebar";
import { ChatInterface } from "@/components/chat/chat-interface";
import { useChatStore } from "@/stores/chat-store";
import { GlobalSearch } from "@/components/shared/global-search";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("id");
  const { setActiveConversationId } = useChatStore();

  useEffect(() => {
    setActiveConversationId(conversationId);
  }, [conversationId, setActiveConversationId]);

  return (
    <AppShell>
      <GlobalSearch />
      <ChatInterface conversationId={conversationId} />
    </AppShell>
  );
}
