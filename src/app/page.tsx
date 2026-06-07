import { ChatWindow } from '@/components/chat/ChatWindow';
import { Workspace } from '@/components/workspace/Workspace';
import { useWorkspaceStore } from '@/store/use-workspace-store';

export default function Page() {
  const { activeMode } = useWorkspaceStore();

  return (
    <div className="flex h-screen w-full bg-zinc-950 overflow-hidden">
      {activeMode === 'chat' && <ChatWindow />}
      {activeMode === 'workspace' && <Workspace />}
      {activeMode === 'projects' && (
        <div className="flex-1 flex items-center justify-center text-zinc-500 font-medium">
          Projects Mode (Coming Soon)
        </div>
      )}
      {activeMode === 'memory' && (
        <div className="flex-1 flex items-center justify-center text-zinc-500 font-medium">
          Memory Mode (Coming Soon)
        </div>
      )}
    </div>
  );
}
