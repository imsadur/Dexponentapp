import { Workspace } from "@/components/workspace";
import { templates } from "@/domain/strategy";

const staticRoutes = [
  ["dashboard"],
  ["explore"],
  ["farms"],
  ["farms", "drafts"],
  ["farms", "new"],
  ["farms", "demo-0"],
  ["farms", "demo-1"],
  ["farms", "demo-2"],
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

export default function Page() {
  return <Workspace />;
}
