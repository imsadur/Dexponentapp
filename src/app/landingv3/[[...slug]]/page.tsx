import { LandingV3Root } from "@/Landingv3/landing";

const routes = [[], ["home"], ["yield"], ["farms"], ["networks"], ["farm-details", "eth-neutral"], ["farm-details", "blue-chip"], ["farm-details", "stable-yield"]];
export const dynamicParams = false;
export function generateStaticParams() { return routes.map((slug) => ({ slug })); }

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  return <LandingV3Root segments={slug?.length ? slug : ["home"]} />;
}
