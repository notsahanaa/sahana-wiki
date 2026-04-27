import type { ReactNode } from "react";
import { SourceProvider } from "./SourceContext";
import { SourcePanel } from "./SourcePanel";
import { ResponsiveLayout } from "./ResponsiveLayout";
import { getClusteredTree } from "@/lib/wiki";

export async function AppShell({ children }: { children: ReactNode }) {
  const tree = await getClusteredTree();

  return (
    <SourceProvider>
      <ResponsiveLayout tree={tree}>{children}</ResponsiveLayout>
      <SourcePanel />
    </SourceProvider>
  );
}
