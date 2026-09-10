import { notFound } from "next/navigation";
import { Landing } from "@/components/landing";
import { Workspace } from "@/components/workspace";

const releases = {
  landing: ["v1", "v2"],
  dashboard: ["v1", "v2"],
} as const;

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ surface: string; version: string }>;
}) {
  const { surface, version } = await params;
  const versions = releases[surface as keyof typeof releases];
  if (!versions?.includes(version as never)) notFound();

  if (surface === "landing") return <Landing release={version} />;
  return <Workspace previewVersion={version} />;
}
