import { Suspense } from "react";
import ChatPage from "./chat-page";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-zinc-500">Loading...</div>}>
      <ChatPage />
    </Suspense>
  );
}
