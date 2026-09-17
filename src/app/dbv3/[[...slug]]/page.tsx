import { Suspense } from "react";
import { DBv3Root } from "@/DBv3/app";

const routes = [
  [],
  ["dashboard"],
  ["positions"],
  ["explore"],
  ["farms"],
  ["farms", "create"],
  ["farms", "manage"],
  ["templates"],
  ["analytics"],
  ["profile"],
  ["settings"],
  ["notifications"],
  ["resources"],
  ["trade"],
];

export const dynamicParams = false;
export function generateStaticParams() { return routes.map((slug) => ({ slug })); }

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  return <Suspense fallback={<div>Loading DBv3…</div>}><DBv3Root segments={slug?.length ? slug : ["dashboard"]} /></Suspense>;
}

