import type { ReactNode } from "react";
import { SourceProvider } from "./SourceContext";
import { SourcePanel } from "./SourcePanel";
import { InboxProvider } from "./InboxContext";
import { InboxModal } from "./InboxModal";
import { ManageModeProvider } from "./ManageModeContext";
import { ResponsiveLayout } from "./ResponsiveLayout";
import { getClusterManifest, getClusteredTree } from "@/lib/wiki";

export async function AppShell({ children }: { children: ReactNode }) {
  const [tree, manifest] = await Promise.all([
    getClusteredTree(),
    getClusterManifest(),
  ]);

  return (
    <SourceProvider>
      <InboxProvider>
        <ManageModeProvider manifest={manifest}>
          <ResponsiveLayout tree={tree}>{children}</ResponsiveLayout>
          <SourcePanel />
          <InboxModal />
        </ManageModeProvider>
      </InboxProvider>
    </SourceProvider>
  );
}
