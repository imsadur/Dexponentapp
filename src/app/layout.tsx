import type { Metadata } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./globals.css";
import { AppProvider } from "@/components/provider";
export const metadata: Metadata = {
  title: "Dexponent — Launch, raise and run onchain funds",
  description:
    "Create, launch, manage, and explore transparent onchain Farms.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
