import { notFound } from "next/navigation";
import { Landing } from "@/components/landing";
import { Workspace } from "@/components/workspace";
import { Suspense } from "react";
import { DBv3Root } from "@/DBv3/app";
import { LandingV3Root } from "@/Landingv3/landing";

const releases = {
  landing: ["v1", "v2", "v3"],
  dashboard: ["v1", "v2", "v3"],
} as const;

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.entries(releases).flatMap(([surface, versions]) =>
    versions.map((version) => ({ surface, version })),
  );
}

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ surface: string; version: string }>;
}) {
  const { surface, version } = await params;
  const versions = releases[surface as keyof typeof releases];
  if (!versions?.includes(version as never)) notFound();

  if (surface === "landing") return version === "v3" ? <LandingV3Root segments={["home"]} /> : <Landing release={version} />;
  if (version === "v3") return <Suspense fallback={<div>Loading DBv3…</div>}><DBv3Root segments={["dashboard"]} /></Suspense>;
  return (
    <Suspense fallback={<div className="loading-shell"><div className="skeleton" /></div>}>
      <Workspace previewVersion={version} />
    </Suspense>
  );
}
