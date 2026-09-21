import { Workspace } from "@/components/workspace";
import { templates } from "@/domain/strategy";
import { Suspense } from "react";

const staticRoutes = [
  ["dashboard"],
  ["explore"],
  ["farms"],
  ["farms", "drafts"],
  ["farms", "new"],
  ["farms", "manage"],
  ["farms", "edit"],
  ["farms", "demo-0"],
  ["farms", "demo-1"],
  ["farms", "demo-2"],
  ["trade"],
  ["positions"],
  ["strategies"],
  ["templates"],
  ["analytics"],
  ["settings"],
  ["settings", "wallet"],
  ["settings", "team"],
  ["settings", "security"],
  ["resources"],
  ...templates.map((template) => ["templates", template.id]),
];

export const dynamicParams = false;

export function generateStaticParams() {
  return staticRoutes.map((slug) => ({ slug }));
}

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug = [] } = await params;
  return (
    <Suspense fallback={<div className="loading-shell"><div className="skeleton" /></div>}>
      <Workspace routeSegments={["app", ...slug]} />
    </Suspense>
  );
}
