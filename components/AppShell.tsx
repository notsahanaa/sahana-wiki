import type { ReactNode } from "react";
import { SourceProvider } from "./SourceContext";
import { SourcePanel } from "./SourcePanel";
import { InboxProvider } from "./InboxContext";
import { InboxModal } from "./InboxModal";
import { ResponsiveLayout } from "./ResponsiveLayout";
import { getClusteredTree } from "@/lib/wiki";

export async function AppShell({ children }: { children: ReactNode }) {
  const tree = await getClusteredTree();

  return (
    <SourceProvider>
      <InboxProvider>
        <ResponsiveLayout tree={tree}>{children}</ResponsiveLayout>
        <SourcePanel />
        <InboxModal />
      </InboxProvider>
    </SourceProvider>
  );
}
