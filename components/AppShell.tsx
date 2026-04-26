import type { ReactNode } from "react";
import { SourceProvider } from "./SourceContext";
import { SourcePanel } from "./SourcePanel";
import { TopicTree } from "./TopicTree";
import { getWikiTree } from "@/lib/wiki";

export async function AppShell({ children }: { children: ReactNode }) {
  const tree = await getWikiTree();

  return (
    <SourceProvider>
      <div className="grid min-h-screen" style={{ gridTemplateColumns: "260px 1fr" }}>
        <aside className="sticky top-0 h-screen overflow-y-auto border-r border-ink-muted bg-bg-subtle">
          <TopicTree tree={tree} />
        </aside>
        <main className="min-h-screen">{children}</main>
      </div>
      <SourcePanel />
    </SourceProvider>
  );
}
