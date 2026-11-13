import type { Metadata } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./globals.css";
import { AppProvider } from "@/components/provider";
import { Anuphan } from "next/font/google";

// Same wordmark face as dexponent.com's navbar logo.
const brandFont = Anuphan({ subsets: ["latin"], weight: ["500"], display: "swap", variable: "--font-brand" });
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
    <html lang="en" data-scroll-behavior="smooth" className={brandFont.variable}>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
